import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  StatusBadge,
  Button,
  MapPreview,
  Chip,
  GlassChip,
  GlassView,
} from '../../components';
import { colors, spacing, radius, typography, glass } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useObjectStore } from '../../store/objectStore';
import {
  Project,
  PropertyObject,
  REPAIR_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  ROOM_COUNT_LABELS,
} from '../../types';
import { getLayoutById } from '../../data/layouts';
import { formatRubles } from '../../utils/calculator';
import { LayoutCardMini } from '../../components/LayoutCard';
import { SvgXml } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PORTFOLIO_CARD_WIDTH = SCREEN_WIDTH * 0.78;
const OBJECT_CARD_WIDTH = 260;

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// How-it-works step icons (titles/texts come from i18n)
const HOW_IT_WORKS_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'document-text-outline',
  'people-outline',
  'checkmark-circle-outline',
];

// Mock portfolio data — IDs match PortfolioScreen cases
const MOCK_PORTFOLIO = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
    repairType: 'Стандартный',
    area: '54 м²',
    address: 'ул. Ленина, 15',
    cost: '870 000 ₽',
    duration: '45 дней',
    rating: 4.9,
    reviewCount: 12,
    supervisorName: 'Алексей К.',
    stagesCount: 14,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
    repairType: 'Капитальный',
    area: '78 м²',
    address: 'пр. Мира, 42',
    cost: '1 560 000 ₽',
    duration: '72 дня',
    rating: 5.0,
    reviewCount: 8,
    supervisorName: 'Борисова Е.',
    stagesCount: 14,
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600',
    repairType: 'Косметический',
    area: '38 м²',
    address: 'ул. Пушкина, 8',
    cost: '285 000 ₽',
    duration: '21 день',
    rating: 4.8,
    reviewCount: 15,
    supervisorName: 'Григорьев М.',
    stagesCount: 8,
  },
];

export function ClientHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { projects, isLoading, loadProjects } = useProjectStore();
  const { objects, loadObjects } = useObjectStore();

  const refresh = useCallback(() => {
    if (user?.id) {
      loadProjects(user.id);
      loadObjects(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renderProject = ({ item }: { item: Project }) => (
    <Pressable
      onPress={() =>
        navigation.navigate('ProjectDetail', {
          projectId: item.id,
          project: item,
        })
      }
    >
      <Card style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <StatusBadge status={item.status} type="project" />
          <Text style={styles.projectDate}>
            {new Date(item.created_at).toLocaleDateString('ru-RU')}
          </Text>
        </View>
        <Text style={styles.projectTitle}>{item.title}</Text>
        <Text style={styles.projectAddress}>{item.address}</Text>
        <MapPreview address={item.address} />
        <View style={styles.projectMeta}>
          <Chip label={`${item.area_sqm} м²`} />
          <Chip label={REPAIR_TYPE_LABELS[item.repair_type]} />
        </View>
        {item.budget_min != null && item.budget_max != null && (
          <Text style={styles.projectBudget}>
            {formatRubles(item.budget_min)} – {formatRubles(item.budget_max)}
          </Text>
        )}
      </Card>
    </Pressable>
  );

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Compact Profile Header */}
      <Pressable
        style={styles.header}
        onPress={() => navigation.navigate('Profile')}
      >
        <View style={styles.avatarButton}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name[0].toUpperCase() : '?'}
            </Text>
          )}
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerName} numberOfLines={1}>
            {user?.name || 'Клиент'}
          </Text>
          <View style={styles.headerObjectRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={colors.textLight}
            />
            <Text style={styles.headerObjectText} numberOfLines={1}>
              {objects.length > 0
                ? objects[0].address
                : 'Добавьте объект'}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textLight}
          style={{ marginLeft: 'auto' }}
        />
      </Pressable>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Banner */}
        <View style={styles.padded}>
          <Card style={styles.heroBanner}>
            <Text style={styles.heroTitle}>
              {t('home.heroTitle')}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('home.heroSubtitle')}
            </Text>
            <Button
              title={t('home.heroButton')}
              onPress={() => navigation.navigate('AddObject')}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        </View>

        {/* How it works */}
        <Text style={[styles.sectionTitle, styles.padded]}>
          {t('home.howItWorks')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.howItWorksScroll}
        >
          {HOW_IT_WORKS_ICONS.map((icon, i) => (
            <Card key={i} style={styles.howItWorksCard}>
              <View style={styles.howItWorksIconCircle}>
                <Ionicons name={icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.howItWorksTitle}>{t(`home.step${i + 1}Title`)}</Text>
              <Text style={styles.howItWorksText}>{t(`home.step${i + 1}Text`)}</Text>
            </Card>
          ))}
        </ScrollView>

        {/* Platform stats — glass blocks */}
        <Text style={[styles.sectionTitle, styles.padded]}>{t('home.trustUs')}</Text>
        <View style={[styles.statsRow, styles.padded]}>
          {[
            { num: '150+', label: t('home.statsProjects'), icon: 'construct-outline' as keyof typeof Ionicons.glyphMap },
            { num: '4.8', label: t('home.statsRating'), icon: 'star-outline' as keyof typeof Ionicons.glyphMap },
            { num: '98%', label: t('home.statsClients'), icon: 'heart-outline' as keyof typeof Ionicons.glyphMap },
          ].map((stat) => (
            <View key={stat.num} style={styles.statBlock}>
              <Ionicons name={stat.icon} size={20} color={colors.primary} style={{ marginBottom: 4 }} />
              <Text style={styles.statNumber}>{stat.num}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Portfolio carousel — reference card design */}
        <View style={[styles.sectionHeaderRow, styles.padded]}>
          <Text style={styles.sectionTitle}>{t('home.realizedProjects')}</Text>
          <Pressable onPress={() => navigation.navigate('Portfolio')}>
            <Text style={styles.sectionLink}>{t('home.viewAll')}</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.portfolioScroll}
          decelerationRate="fast"
          snapToInterval={PORTFOLIO_CARD_WIDTH + spacing.md}
          snapToAlignment="start"
        >
          {MOCK_PORTFOLIO.map((item) => (
            <Pressable
              key={item.id}
              style={styles.portfolioCard}
              onPress={() =>
                navigation.navigate('CaseDetail', { caseId: item.id })
              }
            >
              {/* Image with glass overlays */}
              <View style={styles.portfolioImageContainer}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.portfolioImage}
                />
                {/* Glass chip — repair type */}
                <View style={styles.portfolioChipOverlay}>
                  <GlassChip label={item.repairType} variant="light" size="sm" />
                </View>
                {/* Glass bookmark */}
                <View style={styles.portfolioBookmarkOverlay}>
                  <View style={styles.portfolioBookmarkCircle}>
                    <Ionicons
                      name="bookmark-outline"
                      size={14}
                      color={colors.heading}
                    />
                  </View>
                </View>
              </View>

              {/* Info — reference layout */}
              <View style={styles.portfolioInfo}>
                {/* Name + rating row */}
                <View style={styles.portfolioNameRow}>
                  <Text style={styles.portfolioSupervisor} numberOfLines={1}>
                    {item.supervisorName}
                  </Text>
                  <View style={styles.portfolioRating}>
                    <Ionicons name="star" size={12} color={colors.primary} />
                    <Text style={styles.portfolioRatingText}>
                      {item.rating} ({item.reviewCount})
                    </Text>
                  </View>
                </View>

                {/* Repair type + stages */}
                <View style={styles.portfolioDescRow}>
                  <Text style={styles.portfolioDescTitle} numberOfLines={1}>
                    {item.repairType} ремонт
                  </Text>
                  <View style={styles.portfolioStagesChip}>
                    <Text style={styles.portfolioStagesText}>
                      +{item.stagesCount}
                    </Text>
                  </View>
                </View>

                {/* Area + duration */}
                <View style={styles.portfolioLocationRow}>
                  <Ionicons
                    name="resize-outline"
                    size={13}
                    color={colors.primary}
                  />
                  <Text style={styles.portfolioLocationText}>
                    {item.area} · {item.duration}
                  </Text>
                </View>

                {/* Cost + duration */}
                <Text style={styles.portfolioCost}>
                  {item.cost}
                  <Text style={styles.portfolioDuration}>
                    {' '}· {item.duration}
                  </Text>
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* My Objects */}
        <View style={[styles.sectionHeaderRow, styles.padded]}>
          <Text style={styles.sectionTitle}>{t('home.myObjects')}</Text>
          {objects.length > 0 && (
            <Pressable onPress={() => navigation.navigate('AddObject')}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            </Pressable>
          )}
        </View>
        {objects.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.objectsScroll}
          >
            {objects.map((obj) => {
              const layout = obj.layout_id ? getLayoutById(obj.layout_id) : null;
              const objProjects = projects.filter((p) => p.object_id === obj.id);
              const activeCount = objProjects.filter(
                (p) => p.status === 'in_progress' || p.status === 'planning',
              ).length;
              const completedCount = objProjects.filter(
                (p) => p.status === 'completed',
              ).length;

              return (
                <Pressable
                  key={obj.id}
                  style={styles.objectCard}
                  onPress={() =>
                    navigation.navigate('ObjectDetail', { object: obj })
                  }
                >
                  {/* Layout thumbnail or icon */}
                  <View style={styles.objectLayoutThumb}>
                    {layout ? (
                      <SvgXml xml={layout.svg} width={65} height={65} />
                    ) : (
                      <Ionicons
                        name="home-outline"
                        size={30}
                        color={colors.primary}
                      />
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.objectInfo}>
                    <Text style={styles.objectAddress} numberOfLines={1}>
                      {obj.address}
                    </Text>
                    <Text style={styles.objectMeta} numberOfLines={1}>
                      {PROPERTY_TYPE_LABELS[obj.property_type]} · {obj.total_area} м²
                    </Text>
                    <Text style={styles.objectProjects}>
                      {objProjects.length > 0
                        ? `${objProjects.length} ${objProjects.length === 1 ? 'проект' : 'проекта'}`
                        : 'Нет проектов'}
                    </Text>
                  </View>

                  {/* Status dots */}
                  {objProjects.length > 0 && (
                    <View style={styles.objectDots}>
                      {activeCount > 0 && (
                        <View style={[styles.statusDot, { backgroundColor: colors.orange }]} />
                      )}
                      {completedCount > 0 && (
                        <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : !isLoading ? (
          <View style={styles.padded}>
            <Card style={styles.emptyCard}>
              <Ionicons
                name="home-outline"
                size={56}
                color={colors.primary}
                style={{ marginBottom: spacing.lg }}
              />
              <Text style={styles.emptyTitle}>{t('home.addFirstObject')}</Text>
              <Text style={styles.emptyText}>
                {t('home.addFirstObjectHint')}
              </Text>
              <Button
                title={t('home.addObject')}
                onPress={() => navigation.navigate('AddObject')}
                style={{ marginTop: spacing.xl }}
              />
            </Card>
          </View>
        ) : null}

        {/* Active Projects (if any exist without objects — backward compat) */}
        {projects.filter((p) => !p.object_id).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, styles.padded]}>{t('home.myProjects')}</Text>
            <View style={styles.padded}>
              {projects
                .filter((p) => !p.object_id)
                .map((project) => (
                  <View key={project.id}>
                    {renderProject({ item: project })}
                  </View>
                ))}
            </View>
          </>
        )}

        {/* CTA Banner — gradient glass */}
        <View style={styles.padded}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBanner}
          >
            <Text style={styles.ctaTitle}>{t('home.ctaTitle')}</Text>
            <Text style={styles.ctaText}>
              {t('home.ctaText')}
            </Text>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>{t('home.ctaButton')}</Text>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Extra padding for glass tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitial: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.white,
  },
  headerTextBlock: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerName: {
    ...typography.h3,
    color: colors.heading,
    lineHeight: 22,
  },
  headerObjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  headerObjectText: {
    ...typography.small,
    color: colors.textLight,
  },
  scroll: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
  // Hero Banner
  heroBanner: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.xxl,
  },
  heroTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textLight,
    lineHeight: 22,
  },
  // Section titles
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLink: {
    ...typography.body,
    color: colors.primary,
  },
  // How it works
  howItWorksScroll: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl + 8,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  howItWorksCard: {
    width: 240,
    padding: spacing.lg,
  },
  howItWorksIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  howItWorksTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  howItWorksText: {
    ...typography.small,
    color: colors.textLight,
    lineHeight: 18,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xxl,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.xs,
  },
  statNumber: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },

  // --- Portfolio carousel (reference card design) ---
  portfolioScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  portfolioCard: {
    width: PORTFOLIO_CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  portfolioImageContainer: {
    position: 'relative',
  },
  portfolioImage: {
    width: PORTFOLIO_CARD_WIDTH,
    height: PORTFOLIO_CARD_WIDTH * 0.62,
    resizeMode: 'cover',
  },
  portfolioChipOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  portfolioBookmarkOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  portfolioBookmarkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: glass.fill.light,
    borderWidth: 1,
    borderColor: glass.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioInfo: {
    padding: spacing.md,
  },
  portfolioNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  portfolioSupervisor: {
    ...typography.small,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  portfolioRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  portfolioRatingText: {
    ...typography.smallBold,
    color: colors.heading,
  },
  portfolioDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  portfolioDescTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
  },
  portfolioStagesChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingVertical: 1,
    paddingHorizontal: spacing.sm,
  },
  portfolioStagesText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  portfolioLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: spacing.xs,
  },
  portfolioLocationText: {
    ...typography.small,
    color: colors.primary,
  },
  portfolioCost: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  portfolioDuration: {
    ...typography.body,
    color: colors.textLight,
    fontWeight: '400',
  },

  // My Objects
  objectsScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  objectCard: {
    width: OBJECT_CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  objectLayoutThumb: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    marginRight: spacing.md,
  },
  objectInfo: {
    flex: 1,
  },
  objectAddress: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  objectMeta: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  objectProjects: {
    ...typography.small,
    color: colors.primary,
  },
  objectDots: {
    flexDirection: 'row',
    gap: 4,
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // My Projects (backward compat for projects without objects)
  projectCard: {
    marginBottom: spacing.lg,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  projectDate: {
    ...typography.small,
    color: colors.textLight,
  },
  projectTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  projectAddress: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  projectBudget: {
    ...typography.bodyBold,
    color: colors.gold,
  },
  // Empty
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    marginTop: spacing.sm,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  // CTA Banner
  ctaBanner: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  ctaTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  ctaText: {
    ...typography.body,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
