import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  ViewToken,
  Platform,
  Pressable,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  Button,
  Chip,
  CellIndicator,
  LabelMaster,
  SystemButton,
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// On web, @react-navigation/stack wraps screen content in a div with
// flex: 0 0 auto + minHeight that expands to content size, breaking ScrollView.
// Using absolute positioning forces the container to match the card's fixed bounds.
const webAbsoluteFill = Platform.OS === 'web'
  ? ({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any)
  : undefined;

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

// Full case data keyed by ID
interface CaseData {
  id: string;
  repairType: string;
  address: string;
  area: string;
  cost: string;
  duration: string;
  stages: string;
  description: string;
  photos: { url: string; label: string }[];
  stagePhotos: { url: string; title: string }[];
  review: {
    rating: number;
    text: string;
    author: string;
    date: string;
  };
  supervisor: {
    name: string;
    level: 'start' | 'profi' | 'expert';
    rating: number;
    reviewCount: number;
  };
  masters: { name: string; role: string }[];
}

const MOCK_CASES_DETAIL: Record<string, CaseData> = {
  '1': {
    id: '1',
    repairType: 'Стандартный ремонт',
    address: 'ул. Ленина, 15, кв. 42',
    area: '54 м²',
    cost: '870 000 ₽',
    duration: '45 дней',
    stages: '14',
    description:
      'Полный ремонт двухкомнатной квартиры в новостройке. Демонтаж старых покрытий, выравнивание стен, замена электрики и сантехники, укладка ламината, покраска стен, установка натяжных потолков.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', label: 'После' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', label: 'До' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', label: 'Процесс' },
    ],
    stagePhotos: [
      { url: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=300', title: 'Демонтаж' },
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=300', title: 'Электрика' },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=300', title: 'Стяжка' },
    ],
    review: {
      rating: 5,
      text: 'Очень довольны результатом! Супервайзер Алексей контролировал каждый этап, все сроки соблюдены. Мастера работали аккуратно, после ремонта даже генеральная уборка не понадобилась. Рекомендуем!',
      author: 'Анна К.',
      date: 'Январь 2025',
    },
    supervisor: {
      name: 'Алексей Петров',
      level: 'expert',
      rating: 4.9,
      reviewCount: 87,
    },
    masters: [
      { name: 'Иван Кузнецов', role: 'Электрик' },
      { name: 'Сергей Попов', role: 'Отделочник' },
    ],
  },
  '2': {
    id: '2',
    repairType: 'Капитальный ремонт',
    address: 'пр. Мира, 42, кв. 18',
    area: '78 м²',
    cost: '1 560 000 ₽',
    duration: '72 дня',
    stages: '14',
    description:
      'Капитальный ремонт трёхкомнатной квартиры. Полная перепланировка, замена всех коммуникаций, утепление стен, новая стяжка, дизайнерская отделка ванной и кухни.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', label: 'После' },
      { url: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=800', label: 'До' },
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', label: 'Процесс' },
    ],
    stagePhotos: [
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=300', title: 'Демонтаж' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300', title: 'Стяжка' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300', title: 'Отделка' },
    ],
    review: {
      rating: 5,
      text: 'Капитальный ремонт прошёл идеально. Команда справилась за 72 дня. Особенно понравилась работа электрика и плиточника. Квартира не узнать!',
      author: 'Михаил Д.',
      date: 'Декабрь 2024',
    },
    supervisor: {
      name: 'Елена Борисова',
      level: 'profi',
      rating: 4.8,
      reviewCount: 64,
    },
    masters: [
      { name: 'Дмитрий Лебедев', role: 'Сантехник' },
      { name: 'Андрей Морозов', role: 'Плиточник' },
      { name: 'Павел Новиков', role: 'Электрик' },
    ],
  },
  '3': {
    id: '3',
    repairType: 'Косметический ремонт',
    address: 'ул. Пушкина, 8, кв. 5',
    area: '38 м²',
    cost: '285 000 ₽',
    duration: '21 день',
    stages: '8',
    description:
      'Косметический ремонт однокомнатной квартиры. Покраска стен, замена напольного покрытия, обновление потолков, установка нового плинтуса и розеток.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', label: 'После' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', label: 'До' },
    ],
    stagePhotos: [
      { url: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=300', title: 'Подготовка' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300', title: 'Покраска' },
    ],
    review: {
      rating: 4,
      text: 'Быстро и качественно сделали косметический ремонт. За три недели квартира преобразилась. Единственное — хотелось бы больше вариантов цвета краски.',
      author: 'Ольга С.',
      date: 'Февраль 2025',
    },
    supervisor: {
      name: 'Максим Григорьев',
      level: 'start',
      rating: 4.7,
      reviewCount: 35,
    },
    masters: [
      { name: 'Виктор Соловьёв', role: 'Маляр' },
    ],
  },
  '4': {
    id: '4',
    repairType: 'Дизайнерский ремонт',
    address: 'ул. Гагарина, 30, кв. 112',
    area: '92 м²',
    cost: '3 200 000 ₽',
    duration: '90 дней',
    stages: '14',
    description:
      'Дизайнерский ремонт четырёхкомнатной квартиры по авторскому проекту. Эксклюзивные материалы, встроенная мебель на заказ, умный дом, скрытая подсветка, натуральный камень в ванных.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=800', label: 'После' },
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', label: 'До' },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', label: 'Процесс' },
    ],
    stagePhotos: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300', title: 'Планировка' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300', title: 'Отделка' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300', title: 'Мебель' },
    ],
    review: {
      rating: 5,
      text: 'Превзошли все ожидания! Дизайнерский ремонт получился именно таким, как мы мечтали. Супервайзер держал всё под контролем. Каждая деталь продумана до мелочей.',
      author: 'Дарья и Павел Н.',
      date: 'Ноябрь 2024',
    },
    supervisor: {
      name: 'Алексей Петров',
      level: 'expert',
      rating: 4.9,
      reviewCount: 87,
    },
    masters: [
      { name: 'Роман Фёдоров', role: 'Дизайнер' },
      { name: 'Алексей Козлов', role: 'Столяр' },
      { name: 'Тимур Исаев', role: 'Электрик' },
    ],
  },
  '5': {
    id: '5',
    repairType: 'Стандартный ремонт',
    address: 'ул. Лесная, 12, кв. 3',
    area: '45 м²',
    cost: '720 000 ₽',
    duration: '38 дней',
    stages: '14',
    description:
      'Стандартный ремонт двушки. Выравнивание стен и потолков, замена электрики, укладка плитки в ванной, ламинат, покраска, установка дверей и плинтусов.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', label: 'После' },
      { url: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=800', label: 'До' },
    ],
    stagePhotos: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300', title: 'Штукатурка' },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=300', title: 'Плитка' },
    ],
    review: {
      rating: 5,
      text: 'Отличный ремонт за разумные деньги. Мастера были пунктуальны и аккуратны. Супервайзер всегда был на связи и оперативно решал вопросы.',
      author: 'Игорь В.',
      date: 'Март 2025',
    },
    supervisor: {
      name: 'Елена Борисова',
      level: 'profi',
      rating: 4.8,
      reviewCount: 64,
    },
    masters: [
      { name: 'Николай Орлов', role: 'Штукатур' },
      { name: 'Сергей Попов', role: 'Плиточник' },
    ],
  },
  '6': {
    id: '6',
    repairType: 'Косметический ремонт',
    address: 'пр. Победы, 55, кв. 21',
    area: '28 м²',
    cost: '196 000 ₽',
    duration: '18 дней',
    stages: '7',
    description:
      'Лёгкий косметический ремонт студии. Покраска стен в светлые тона, замена линолеума на ламинат, обновление потолочного плинтуса, замена розеток и выключателей.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', label: 'После' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', label: 'До' },
    ],
    stagePhotos: [
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=300', title: 'Покраска' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300', title: 'Пол' },
    ],
    review: {
      rating: 4,
      text: 'Хороший косметический ремонт за две с половиной недели. Студия стала светлее и уютнее. Цена оправдана.',
      author: 'Наталья Р.',
      date: 'Январь 2025',
    },
    supervisor: {
      name: 'Максим Григорьев',
      level: 'start',
      rating: 4.7,
      reviewCount: 35,
    },
    masters: [
      { name: 'Виктор Соловьёв', role: 'Маляр' },
    ],
  },
};

// Default fallback for unknown IDs
const DEFAULT_CASE = MOCK_CASES_DETAIL['1'];

export function CaseDetailScreen({ navigation, route }: Props) {
  const caseId: string = route.params?.caseId || '1';
  const caseData = MOCK_CASES_DETAIL[caseId] || DEFAULT_CASE;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  // D3: Use onScroll for cross-platform dot sync (onViewableItemsChanged unreliable on web)
  const handleGalleryScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activePhotoIndex) setActivePhotoIndex(index);
  }, [activePhotoIndex]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActivePhotoIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <View style={[styles.container, webAbsoluteFill]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <View style={styles.galleryContainer}>
          <FlatList
            data={caseData.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScroll={handleGalleryScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Pressable
                style={styles.photoSlide}
                onPress={() => setFullscreenPhoto(item.url)}
              >
                <Image source={{ uri: item.url }} style={styles.galleryImage} />
                <View style={styles.photoLabel}>
                  <Chip label={item.label} />
                </View>
              </Pressable>
            )}
          />

          {/* Back button overlay */}
          <View style={styles.backOverlay}>
            <SystemButton type="back" onPress={() => navigation.goBack()} />
          </View>

          {/* Photo dots */}
          <View style={styles.photoDots}>
            {caseData.photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.photoDot,
                  i === activePhotoIndex && styles.photoDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* Main info */}
          <Text style={styles.title}>{caseData.repairType}</Text>

          {/* Key metrics */}
          <View style={styles.metricsGrid}>
            <CellIndicator variant="row" label="Площадь" value={caseData.area} />
            <CellIndicator variant="row" label="Стоимость" value={caseData.cost} />
            <CellIndicator variant="row" label="Срок" value={caseData.duration} />
            <CellIndicator variant="row" label="Этапов" value={caseData.stages} />
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>О проекте</Text>
          <Text style={styles.description}>{caseData.description}</Text>

          {/* Stage photos */}
          <Text style={styles.sectionTitle}>Этапы работ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stagePhotosScroll}
          >
            {caseData.stagePhotos.map((stage, i) => (
              <Pressable
                key={i}
                style={styles.stagePhotoCard}
                onPress={() => setFullscreenPhoto(stage.url)}
              >
                <Image
                  source={{ uri: stage.url }}
                  style={styles.stagePhotoImage}
                />
                <Text style={styles.stagePhotoTitle}>{stage.title}</Text>
                <Chip label="Завершён" />
              </Pressable>
            ))}
          </ScrollView>

          {/* Review */}
          <Text style={styles.sectionTitle}>Отзыв клиента</Text>
          <Card style={styles.reviewCard}>
            <View style={styles.reviewStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={18}
                  color={
                    i < caseData.review.rating
                      ? colors.primary
                      : colors.border
                  }
                />
              ))}
            </View>
            <Text style={styles.reviewText}>
              «{caseData.review.text}»
            </Text>
            <Text style={styles.reviewAuthor}>{caseData.review.author}</Text>
            <Text style={styles.reviewDate}>{caseData.review.date}</Text>
          </Card>

          {/* Team — full: supervisor + masters */}
          <Text style={styles.sectionTitle}>Команда</Text>
          <Card>
            {/* Supervisor */}
            <View style={styles.teamMember}>
              <View style={styles.teamAvatar}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{caseData.supervisor.name}</Text>
                <View style={styles.teamRoleRow}>
                  <LabelMaster
                    level={caseData.supervisor.level}
                    rating={caseData.supervisor.rating}
                    reviewCount={caseData.supervisor.reviewCount}
                  />
                </View>
              </View>
              <Chip label="Супервайзер" />
            </View>

            {/* Masters */}
            {caseData.masters.map((master, i) => (
              <View key={i} style={[styles.teamMember, i > 0 || true ? styles.teamMemberBorder : undefined]}>
                <View style={[styles.teamAvatar, styles.teamAvatarMaster]}>
                  <Ionicons name="construct" size={18} color={colors.gold} />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{master.name}</Text>
                  <Text style={styles.teamRole}>{master.role}</Text>
                </View>
                <Chip label="Мастер" />
              </View>
            ))}
          </Card>

          {/* CTA */}
          <Button
            title="Хочу такой же ремонт"
            onPress={() => navigation.navigate('CreateProject')}
            fullWidth
            style={{ marginTop: spacing.xxl }}
          />

          <View style={{ height: spacing.huge }} />
        </View>
      </ScrollView>

      {/* Fullscreen photo modal (D4) */}
      <Modal
        visible={!!fullscreenPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <Pressable
          style={styles.fullscreenOverlay}
          onPress={() => setFullscreenPhoto(null)}
        >
          {fullscreenPhoto && (
            <Image
              source={{ uri: fullscreenPhoto }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.fullscreenClose}>
            <Ionicons name="close-circle" size={36} color={colors.white} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  galleryContainer: {
    position: 'relative',
  },
  photoSlide: {
    width: SCREEN_WIDTH,
    height: 300,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
  },
  backOverlay: {
    position: 'absolute',
    top: spacing.huge,
    left: spacing.lg,
  },
  photoDots: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoDotActive: {
    backgroundColor: colors.white,
    width: 24,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.heading,
    marginBottom: spacing.xxl,
  },
  metricsGrid: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  stagePhotosScroll: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  stagePhotoCard: {
    width: 140,
  },
  stagePhotoImage: {
    width: 140,
    height: 100,
    borderRadius: radius.md,
    resizeMode: 'cover',
    marginBottom: spacing.sm,
  },
  stagePhotoTitle: {
    ...typography.small,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  reviewCard: {
    marginBottom: spacing.xxl,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
  },
  reviewText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  reviewAuthor: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  reviewDate: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },
  // ─── Team section ───
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  teamMemberBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 45, 62, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  teamAvatarMaster: {
    backgroundColor: 'rgba(197, 165, 90, 0.1)',
  },
  teamInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  teamName: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  teamRoleRow: {
    marginTop: 2,
  },
  teamRole: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },

  // ─── Fullscreen photo modal ───
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  fullscreenClose: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});
