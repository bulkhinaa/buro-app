import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Chip, GlassChip } from '../../components';
import { colors, spacing, radius, typography, glass } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePortfolioStore } from '../../store/portfolioStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - spacing.xl * 2;

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export interface PortfolioCase {
  id: string;
  images: string[];
  repairType: string;
  area: string;
  cost: string;
  rating: number;
  reviewCount: number;
  address: string;
  duration: string;
  supervisorName: string;
  stagesCount: number;
  description: string;
  likes: number;
}

const FILTER_OPTIONS = ['Все', 'Избранное', 'Косметический', 'Стандартный', 'Капитальный', 'Дизайнерский'];

// Mock data — will be replaced with real API data
export const MOCK_CASES: PortfolioCase[] = [
  {
    id: '1',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    ],
    repairType: 'Стандартный',
    area: '54 м²',
    cost: '870 000 ₽',
    rating: 4.9,
    reviewCount: 12,
    address: 'ул. Ленина, 15',
    duration: '45 дней',
    supervisorName: 'Алексей К.',
    stagesCount: 14,
    description: 'Полный ремонт квартиры',
    likes: 47,
  },
  {
    id: '2',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ],
    repairType: 'Капитальный',
    area: '78 м²',
    cost: '1 560 000 ₽',
    rating: 5.0,
    reviewCount: 8,
    address: 'пр. Мира, 42',
    duration: '72 дня',
    supervisorName: 'Борисова Е.',
    stagesCount: 14,
    description: 'Капитальный ремонт трёхкомнатной',
    likes: 83,
  },
  {
    id: '3',
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    ],
    repairType: 'Косметический',
    area: '38 м²',
    cost: '285 000 ₽',
    rating: 4.8,
    reviewCount: 15,
    address: 'ул. Пушкина, 8',
    duration: '21 день',
    supervisorName: 'Григорьев М.',
    stagesCount: 8,
    description: 'Обновление студии',
    likes: 31,
  },
  {
    id: '4',
    images: [
      'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    ],
    repairType: 'Дизайнерский',
    area: '92 м²',
    cost: '3 200 000 ₽',
    rating: 5.0,
    reviewCount: 6,
    address: 'ул. Гагарина, 30',
    duration: '90 дней',
    supervisorName: 'Алексей К.',
    stagesCount: 14,
    description: 'Авторский дизайн-проект',
    likes: 124,
  },
  {
    id: '5',
    images: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    ],
    repairType: 'Стандартный',
    area: '45 м²',
    cost: '720 000 ₽',
    rating: 4.7,
    reviewCount: 9,
    address: 'ул. Лесная, 12',
    duration: '38 дней',
    supervisorName: 'Борисова Е.',
    stagesCount: 14,
    description: 'Ремонт двушки в новостройке',
    likes: 56,
  },
  {
    id: '6',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ],
    repairType: 'Косметический',
    area: '28 м²',
    cost: '196 000 ₽',
    rating: 4.6,
    reviewCount: 21,
    address: 'пр. Победы, 55',
    duration: '18 дней',
    supervisorName: 'Григорьев М.',
    stagesCount: 6,
    description: 'Быстрое обновление интерьера',
    likes: 19,
  },
];

// --- Image carousel with dots ---
function ImageCarousel({ images, width }: { images: string[]; width: number }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {images.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{ width, height: width * 0.75, resizeMode: 'cover' }}
          />
        ))}
      </ScrollView>
      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// --- Stage chips ---
const STAGES_PREVIEW = ['Демонтаж', 'Электрика', 'Стяжка', 'Штукатурка', 'Плитка'];

export function PortfolioScreen({ navigation }: Props) {
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const { bookmarks, toggleBookmark, toggleLike, isLiked } = usePortfolioStore();

  const filteredCases =
    selectedFilter === 'Все'
      ? MOCK_CASES
      : selectedFilter === 'Избранное'
        ? MOCK_CASES.filter((c) => bookmarks.has(c.id))
        : MOCK_CASES.filter((c) => c.repairType === selectedFilter);

  const renderCase = useCallback(({ item }: { item: PortfolioCase }) => {
    const isSaved = bookmarks.has(item.id);
    const liked = isLiked(item.id);
    const likeCount = item.likes + (liked ? 1 : 0);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
      >
        {/* Image carousel section */}
        <View style={styles.imageSection}>
          <ImageCarousel images={item.images} width={IMAGE_WIDTH} />

          {/* Glass chip — repair type (top-left) */}
          <View style={styles.chipOverlay}>
            <GlassChip label={item.repairType} variant="light" />
          </View>

          {/* Glass bookmark button (top-right) */}
          <Pressable
            style={styles.bookmarkOverlay}
            onPress={() => toggleBookmark(item.id)}
            hitSlop={8}
          >
            <View style={styles.bookmarkCircle}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isSaved ? colors.primary : colors.heading}
              />
            </View>
          </Pressable>
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          {/* Row 1: Supervisor name + rating */}
          <View style={styles.nameRow}>
            <Text style={styles.supervisorLabel}>Супервайзер</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={styles.ratingText}>
                {item.rating} ({item.reviewCount})
              </Text>
            </View>
          </View>
          <Text style={styles.supervisorName} numberOfLines={1}>
            {item.supervisorName}
          </Text>

          {/* Row 2: Description */}
          <Text style={styles.descTitle} numberOfLines={1}>
            {item.description}
          </Text>

          {/* Row 3: Area + Cost + duration */}
          <Text style={styles.costText}>
            {item.area} · {item.cost}
            <Text style={styles.durationText}> · {item.duration}</Text>
          </Text>

          {/* Row 4: Likes + stage chips */}
          <View style={styles.bottomRow}>
            <Pressable
              style={styles.likeButton}
              onPress={() => toggleLike(item.id)}
              hitSlop={8}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? colors.danger : colors.textLight}
              />
              <Text style={[styles.likeCount, liked && { color: colors.danger }]}>
                {likeCount}
              </Text>
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stagesScroll}
              style={styles.stagesContainer}
            >
              <View style={styles.stageCalendarChip}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </View>
              {STAGES_PREVIEW.map((stage) => (
                <View key={stage} style={styles.stageChip}>
                  <Text style={styles.stageChipText}>{stage}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Pressable>
    );
  }, [bookmarks, toggleBookmark, toggleLike, isLiked, navigation]);

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.title}>Наши работы</Text>
      <Text style={styles.subtitle}>Реальные проекты наших клиентов</Text>

      {/* Filters — fixed, not scrollable vertically */}
      <FlatList
        horizontal
        data={FILTER_OPTIONS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        style={styles.filterContainer}
        renderItem={({ item }) => (
          <Chip
            label={item}
            selected={selectedFilter === item}
            onPress={() => setSelectedFilter(item)}
          />
        )}
      />

      {/* Cards list — single column, large cards */}
      {filteredCases.length > 0 ? (
        <FlatList
          data={filteredCases}
          renderItem={renderCase}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.listContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={3}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name={selectedFilter === 'Избранное' ? 'bookmark-outline' : 'camera-outline'}
            size={56}
            color={colors.primary}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'Избранное' ? 'Нет избранных проектов' : 'Скоро здесь появятся проекты'}
          </Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'Избранное'
              ? 'Нажмите на закладку, чтобы сохранить проект'
              : 'Мы работаем над первыми объектами'}
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // --- Header ---
  title: {
    ...typography.h1,
    color: colors.heading,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },

  // --- Filters ---
  filterContainer: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.lg,
  },
  filterList: {
    gap: spacing.sm,
  },

  // --- Card list ---
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
    gap: spacing.lg,
  },

  // --- Card ---
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },

  // --- Image section ---
  imageSection: {
    position: 'relative',
  },
  chipOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  bookmarkOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  bookmarkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: glass.fill.light,
    borderWidth: 1,
    borderColor: glass.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Dot indicators ---
  dotsContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.white,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // --- Info section ---
  infoSection: {
    padding: spacing.lg,
  },

  // Row 1: Supervisor label + rating
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  supervisorLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  supervisorName: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.bodyBold,
    color: colors.heading,
  },

  // Row 2: Description
  descTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },

  // Row 3: Cost
  costText: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.md,
  },
  durationText: {
    ...typography.body,
    color: colors.textLight,
    fontWeight: '400',
  },

  // Row 4: Likes + stage chips
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  likeCount: {
    ...typography.small,
    color: colors.textLight,
    fontWeight: '600',
  },
  stagesContainer: {
    flex: 1,
    flexGrow: 0,
  },
  stagesScroll: {
    gap: spacing.sm,
  },
  stageCalendarChip: {
    height: 36,
    width: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  stageChip: {
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  stageChipText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  // --- Empty state ---
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
});
