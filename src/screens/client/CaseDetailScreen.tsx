import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  ViewToken,
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

// Mock case data — will be replaced with API call
const MOCK_CASE = {
  id: 'portfolio-1',
  repairType: 'Стандартный ремонт',
  address: 'ул. Ленина, 15, кв. 42',
  area: '54 м²',
  cost: '870 000 ₽',
  duration: '45 дней',
  stages: '14',
  description:
    'Полный ремонт двухкомнатной квартиры в новостройке. Демонтаж старых покрытий, выравнивание стен, замена электрики и сантехники, укладка ламината, покраска стен, установка натяжных потолков.',
  photos: [
    {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      label: 'После',
    },
    {
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      label: 'До',
    },
    {
      url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      label: 'Процесс',
    },
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
    level: 'expert' as const,
    rating: 4.9,
    reviewCount: 87,
  },
};

export function CaseDetailScreen({ navigation, route }: Props) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const caseData = MOCK_CASE;

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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <View style={styles.galleryContainer}>
          <FlatList
            data={caseData.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={styles.photoSlide}>
                <Image source={{ uri: item.url }} style={styles.galleryImage} />
                <View style={styles.photoLabel}>
                  <Chip label={item.label} />
                </View>
              </View>
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
          <Text style={styles.address}>{caseData.address}</Text>

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
              <View key={i} style={styles.stagePhotoCard}>
                <Image
                  source={{ uri: stage.url }}
                  style={styles.stagePhotoImage}
                />
                <Text style={styles.stagePhotoTitle}>{stage.title}</Text>
                <Chip label="Завершён" />
              </View>
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

          {/* Team */}
          <Text style={styles.sectionTitle}>Команда</Text>
          <Card>
            <LabelMaster
              level={caseData.supervisor.level}
              rating={caseData.supervisor.rating}
              reviewCount={caseData.supervisor.reviewCount}
            />
            <Text style={styles.supervisorName}>
              {caseData.supervisor.name}
            </Text>
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
    marginBottom: spacing.xs,
  },
  address: {
    ...typography.body,
    color: colors.textLight,
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
  supervisorName: {
    ...typography.bodyBold,
    color: colors.heading,
    marginTop: spacing.sm,
  },
});
