import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Chip, GlassChip, EmptyStateIllustration } from '../../components';
import { spacing, radius, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePortfolioStore } from '../../store/portfolioStore';
import { supabase } from '../../lib/supabase';
import { hapticLight } from '../../utils/haptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// --- Image carousel with dots ---
function ImageCarousel({ images, width }: { images: string[]; width: number }) {
  const { colors } = useTheme();
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
                i === activeIndex
                  ? [styles.dotActive, { backgroundColor: colors.white }]
                  : [styles.dotInactive, { backgroundColor: 'rgba(255,255,255,0.5)' }],
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

// Heartbeat scale animation for bookmark/like
function useHeartbeat() {
  const scale = useRef(new Animated.Value(1)).current;
  const trigger = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start();
    hapticLight();
  }, [scale]);
  return { scale, trigger };
}

// Fetch completed projects from Supabase and map to PortfolioCase format
async function fetchPortfolioCases(): Promise<PortfolioCase[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        status,
        budget,
        start_date,
        end_date,
        objects (
          address,
          total_area,
          property_type
        ),
        profiles!projects_supervisor_id_fkey (
          name
        )
      `)
      .eq('status', 'completed')
      .order('end_date', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return [];

    return data.map((project: any, index: number) => {
      const obj = project.objects;
      const supervisor = project.profiles;
      const startDate = project.start_date ? new Date(project.start_date) : null;
      const endDate = project.end_date ? new Date(project.end_date) : null;
      const durationDays = startDate && endDate
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: project.id,
        images: [], // No photo storage for completed projects yet
        repairType: 'Стандартный',
        area: obj?.total_area ? `${obj.total_area} м²` : '',
        cost: project.budget ? `${Number(project.budget).toLocaleString('ru-RU')} ₽` : '',
        rating: 0,
        reviewCount: 0,
        address: obj?.address ?? '',
        duration: durationDays > 0 ? `${durationDays} дней` : '',
        supervisorName: supervisor?.name ?? '',
        stagesCount: 14,
        description: project.title ?? 'Ремонт',
        likes: 0,
      };
    });
  } catch {
    return [];
  }
}

export function PortfolioScreen({ navigation }: Props) {
  const { colors, glass } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const { bookmarks, toggleBookmark, toggleLike, isLiked } = usePortfolioStore();
  const bookmarkAnim = useHeartbeat();
  const likeAnim = useHeartbeat();
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const fetched = await fetchPortfolioCases();
      if (mounted) {
        setCases(fetched);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedFilter(filter);
  }, []);

  const filteredCases =
    selectedFilter === 'Все'
      ? cases
      : selectedFilter === 'Избранное'
        ? cases.filter((c) => bookmarks.has(c.id))
        : cases.filter((c) => c.repairType === selectedFilter);

  const renderCase = useCallback(({ item }: { item: PortfolioCase }) => {
    const isSaved = bookmarks.has(item.id);
    const liked = isLiked(item.id);
    const likeCount = item.likes + (liked ? 1 : 0);

    return (
      <Pressable
        style={[styles.card, {
          backgroundColor: glass.fill.light,
          borderColor: glass.border.light,
          shadowColor: `${colors.primary}14`,
        }]}
        onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
      >
        {/* Image carousel section */}
        {item.images.length > 0 ? (
          <View style={styles.imageSection}>
            <ImageCarousel images={item.images} width={IMAGE_WIDTH} />

            {/* Glass chip -- repair type (top-left) */}
            <View style={styles.chipOverlay}>
              <GlassChip label={item.repairType} variant="light" />
            </View>

            {/* Glass bookmark button (top-right) with heartbeat animation */}
            <Pressable
              style={styles.bookmarkOverlay}
              onPress={() => {
                bookmarkAnim.trigger();
                toggleBookmark(item.id);
              }}
              hitSlop={8}
            >
              <Animated.View style={[styles.bookmarkCircle, {
                backgroundColor: glass.fill.light,
                borderColor: glass.border.light,
              }, { transform: [{ scale: bookmarkAnim.scale }] }]}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={isSaved ? colors.primary : colors.heading}
                />
              </Animated.View>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.bgCard }]}>
            <GlassChip label={item.repairType} variant="light" />
          </View>
        )}

        {/* Info section */}
        <View style={styles.infoSection}>
          {/* Row 1: Supervisor name + rating */}
          <View style={styles.nameRow}>
            <Text style={[styles.supervisorLabel, { color: colors.textLight }]}>Супервайзер</Text>
            {item.rating > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={[styles.ratingText, { color: colors.heading }]}>
                  {item.rating} ({item.reviewCount})
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.supervisorName, { color: colors.heading }]} numberOfLines={1}>
            {item.supervisorName || 'Не указан'}
          </Text>

          {/* Row 2: Description */}
          <Text style={[styles.descTitle, { color: colors.heading }]} numberOfLines={1}>
            {item.description}
          </Text>

          {/* Row 3: Area + Cost + duration */}
          <Text style={[styles.costText, { color: colors.heading }]}>
            {item.area}{item.area && item.cost ? ' · ' : ''}{item.cost}
            {item.duration ? <Text style={[styles.durationText, { color: colors.textLight }]}> · {item.duration}</Text> : null}
          </Text>

          {/* Row 4: Likes + stage chips */}
          <View style={styles.bottomRow}>
            <Pressable
              style={styles.likeButton}
              onPress={() => {
                likeAnim.trigger();
                toggleLike(item.id);
              }}
              hitSlop={8}
            >
              <Animated.View style={{ transform: [{ scale: likeAnim.scale }] }}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={liked ? colors.danger : colors.textLight}
                />
              </Animated.View>
              <Text style={[styles.likeCount, { color: liked ? colors.danger : colors.textLight }]}>
                {likeCount}
              </Text>
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stagesScroll}
              style={styles.stagesContainer}
            >
              <View style={[styles.stageCalendarChip, { borderColor: glass.border.light, backgroundColor: glass.fill.light }]}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </View>
              {STAGES_PREVIEW.map((stage) => (
                <View key={stage} style={[styles.stageChip, { borderColor: glass.border.light, backgroundColor: glass.fill.light }]}>
                  <Text style={[styles.stageChipText, { color: colors.primary }]}>{stage}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Pressable>
    );
  }, [bookmarks, toggleBookmark, toggleLike, isLiked, navigation, colors, glass]);

  return (
    <ScreenWrapper scroll={false}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.heading} />
      </Pressable>
      <Text style={[styles.title, { color: colors.heading }]}>Наши работы</Text>
      <Text style={[styles.subtitle, { color: colors.textLight }]}>Реальные проекты наших клиентов</Text>

      {/* Filters -- fixed, not scrollable vertically */}
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
            onPress={() => handleFilterChange(item)}
          />
        )}
      />

      {/* Loading state */}
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredCases.length > 0 ? (
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
          {selectedFilter === 'Избранное' ? (
            <EmptyStateIllustration
              variant="no-results"
              title="Нет избранных проектов"
              subtitle="Нажмите на закладку, чтобы сохранить проект"
            />
          ) : (
            <EmptyStateIllustration
              variant="no-portfolio"
              title="Пока нет завершённых проектов"
              subtitle="Здесь появятся реальные проекты наших клиентов"
            />
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // --- Back button ---
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  // --- Header ---
  title: {
    ...typography.h1,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
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
    paddingBottom: 24,
    gap: spacing.lg,
  },

  // --- Card ---
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },

  // --- Image section ---
  imageSection: {
    position: 'relative',
  },
  imagePlaceholder: {
    height: 120,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: spacing.md,
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
    borderWidth: 1,
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
  },
  dotInactive: {
    width: 8,
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
  },
  supervisorName: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.bodyBold,
  },

  // Row 2: Description
  descTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },

  // Row 3: Cost
  costText: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  durationText: {
    ...typography.body,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageChip: {
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageChipText: {
    ...typography.small,
    fontWeight: '600',
  },

  // --- Empty state ---
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
});
