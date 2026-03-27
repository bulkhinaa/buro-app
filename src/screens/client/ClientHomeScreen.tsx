import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  StatusBadge,
  Button,
  MapPreview,
  Chip,
  AnimatedEntry,
  EmptyStateIllustration,
  SkeletonCard,
  SharedHeader,
} from '../../components';
import { colors, spacing, radius, typography, useSerifFont } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useObjectStore } from '../../store/objectStore';
import { useNotificationStore } from '../../store/notificationStore';
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


export function ClientHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const serifFont = useSerifFont();
  const { user } = useAuthStore();
  const { projects, isLoading, loadProjects } = useProjectStore();
  const { objects, loadObjects } = useObjectStore();
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.is_read).length);

  useEffect(() => {
    if (user) useNotificationStore.getState().loadNotifications(user.id);
  }, [user]);

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
      <SharedHeader
        title={user?.name || 'Клиент'}
        subtitle={objects.length > 0 ? objects[0].address : 'Добавьте объект'}
        onAvatarPress={() => navigation.navigate('Profile')}
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('NotificationsStack')}
      />

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
        <AnimatedEntry index={0}>
          <View style={styles.padded}>
            <Card style={styles.heroBanner}>
              <Text style={[styles.heroTitle, serifFont]}>
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
        </AnimatedEntry>

        {/* How it works */}
        <AnimatedEntry index={1}>
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
        </AnimatedEntry>

        {/* Portfolio link */}
        <View style={[styles.sectionHeaderRow, styles.padded]}>
          <Text style={styles.sectionTitle}>{t('home.realizedProjects')}</Text>
          <Pressable onPress={() => navigation.navigate('Portfolio')}>
            <Text style={styles.sectionLink}>{t('home.viewAll')}</Text>
          </Pressable>
        </View>
        <View style={styles.padded}>
          <Card style={styles.emptyCard}>
            <EmptyStateIllustration
              variant="no-projects"
              title="Портфолио работ"
              subtitle="Здесь появятся завершённые проекты с фотоотчётами"
            />
            <Button
              title={t('home.viewAll')}
              onPress={() => navigation.navigate('Portfolio')}
              variant="outline"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </View>

        {/* My Objects */}
        <View style={[styles.sectionHeaderRow, styles.padded]}>
          <Text style={styles.sectionTitle}>{t('home.myObjects')}</Text>
          <Pressable
            onPress={() => navigation.navigate('AddObject')}
            accessibilityLabel="Добавить объект"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </Pressable>
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
        ) : isLoading ? (
          <View style={[styles.padded, { gap: spacing.lg }]}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View style={styles.padded}>
            <Card style={styles.emptyCard}>
              <EmptyStateIllustration
                variant="no-projects"
                title={t('home.addFirstObject')}
                subtitle={t('home.addFirstObjectHint')}
              />
              <Button
                title={t('home.addObject')}
                onPress={() => navigation.navigate('AddObject')}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          </View>
        )}

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

        {/* Extra padding for glass tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    ...typography.h2,
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
});
