import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge, AnimatedEntry, SharedHeader, GlassChip } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useMasterStore } from '../../store/masterStore';
import { useTaskStore, type TaskItem } from '../../store/taskStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useToastStore } from '../../store/toastStore';
import { useTranslation } from 'react-i18next';
import { trackTap } from '../../services/analyticsService';
import { SPECIALIZATION_MAP, type SpecializationId } from '../../data/specializations';

// Jump Finance Edge Function is not deployed yet (missing JUMP_FINANCE_CLIENT_KEY secret).
// Set to true once the function is deployed and tested.
const JUMP_FINANCE_ENABLED = false;

export function MasterHomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const profile = useMasterStore((s) => s.profile);
  const { tasks, loadTasks } = useTaskStore();
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.is_read).length);
  const showToast = useToastStore((s) => s.show);
  const [loadError, setLoadError] = useState(false);

  const isVerified = profile?.verification_status === 'approved';
  const completedCount = profile?.completed_tasks ?? 0;
  const rating = profile?.rating ?? 0;

  const loadData = async () => {
    if (!user) return;
    try {
      setLoadError(false);
      await loadTasks(user.id);
      useNotificationStore.getState().loadNotifications(user.id);
    } catch {
      setLoadError(true);
      showToast('Не удалось загрузить данные', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleTaskPress = (task: TaskItem) => {
    trackTap('MasterHome', 'open_task', { stage_id: task.id, status: task.status });
    navigation?.navigate('MasterTaskDetail', { task });
  };

  const activeTasks = tasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const rejectedTasks = tasks.filter((t) => t.status === 'rejected');

  const renderTask = ({ item }: { item: TaskItem }) => {
    const isActive = item.status === 'in_progress';
    const isRejected = item.status === 'rejected';

    return (
      <Pressable onPress={() => handleTaskPress(item)}>
        <Card style={[styles.taskCard, isActive && styles.taskCardActive, isRejected && styles.taskCardRejected]}>
          <View style={styles.taskHeader}>
            <StatusBadge status={item.status} />
            {item.deadline && (
              <Text style={styles.deadline}>
                до {new Date(item.deadline).toLocaleDateString('ru-RU')}
              </Text>
            )}
          </View>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.projectTitle}>{item.projectTitle}</Text>
          <View style={styles.taskFooter}>
            <Ionicons name="location-outline" size={14} color={colors.textLight} />
            <Text style={styles.address}>{item.address}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper>
      <SharedHeader
        title={user?.name || t('master.home.masterFallback')}
        subtitle={t('master.home.yourTasks')}
        onAvatarPress={() => navigation?.navigate('Profile')}
        notificationCount={unreadCount}
        onNotificationPress={() => navigation?.navigate('NotificationsStack')}
      />

      {/* Verification banner — hidden until Jump Finance is deployed */}
      {JUMP_FINANCE_ENABLED && !isVerified && (
        <Pressable style={styles.verificationBanner} onPress={() => navigation?.navigate('JumpFinance')}>
          <View style={styles.verificationIcon}>
            <Ionicons name="shield-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>{t('master.home.notVerified')}</Text>
            <Text style={styles.verificationText}>
              {t('master.home.verificationHint')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeTasks.length}</Text>
          <Text style={styles.statLabel}>{t('master.home.active')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>{t('master.home.completed')}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.primary }]}>{rating}</Text>
          </View>
          <Text style={styles.statLabel}>{t('master.home.rating')}</Text>
        </View>
      </View>

      {/* Specializations chips */}
      {(() => {
        const specs = (profile?.specializations ?? []) as SpecializationId[];
        if (specs.length === 0) {
          return (
            <View style={styles.specsRow}>
              <GlassChip
                label={t('master.home.addSpecializations')}
                size="md"
                active={false}
                onPress={() => navigation?.navigate('EditSpecializations')}
              />
            </View>
          );
        }
        const visible = specs.slice(0, 4);
        const extra = specs.length - 4;
        return (
          <View style={styles.specsRow}>
            {visible.map((id) => (
              <GlassChip
                key={id}
                label={SPECIALIZATION_MAP[id]?.label ?? id}
                size="sm"
                active={true}
              />
            ))}
            {extra > 0 && (
              <GlassChip
                label={t('master.home.moreSpecs', { count: extra })}
                size="sm"
                active={false}
                onPress={() => navigation?.navigate('EditSpecializations')}
              />
            )}
          </View>
        );
      })()}

      {/* Rejected tasks */}
      {rejectedTasks.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            {t('master.home.needsRevision')} ({rejectedTasks.length})
          </Text>
          <FlatList
            data={rejectedTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </>
      )}

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('master.home.inProgress')} ({activeTasks.length})</Text>
          <FlatList
            data={activeTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </>
      )}

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('master.home.pending')} ({pendingTasks.length})</Text>
          <FlatList
            data={pendingTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </>
      )}

      {/* Retry button on load error */}
      {loadError && (
        <Pressable onPress={() => { setLoadError(false); loadData(); }} style={styles.retryButton}>
          <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          <Text style={styles.retryText}>Повторить попытку</Text>
        </Pressable>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !loadError && (
        <AnimatedEntry index={0}>
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="construct-outline" size={44} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Пока нет задач</Text>
            <Text style={styles.emptySubtext}>
              Выполни несколько шагов, чтобы начать получать заказы
            </Text>

            {/* Readiness checklist */}
            <View style={styles.checklistContainer}>
              {/* Step 1 — fill profile */}
              <Pressable
                style={styles.checklistItem}
                onPress={() => navigation?.navigate('Profile')}
              >
                <View style={[styles.checklistBullet, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.checklistContent}>
                  <Text style={styles.checklistTitle}>Заполни профиль</Text>
                  <Text style={styles.checklistSubtitle}>Имя, фото, контакты</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </Pressable>

              {/* Step 2 — add specializations */}
              <Pressable
                style={styles.checklistItem}
                onPress={() => navigation?.navigate('EditProfile')}
              >
                <View style={[styles.checklistBullet, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="build-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.checklistContent}>
                  <Text style={styles.checklistTitle}>Добавь специализации</Text>
                  <Text style={styles.checklistSubtitle}>Что умеешь делать</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </Pressable>

              {/* Step 3 — wait for offer (no navigation, informational) */}
              <View style={[styles.checklistItem, styles.checklistItemLast]}>
                <View style={[styles.checklistBullet, { backgroundColor: `${colors.success}15` }]}>
                  <Ionicons name="time-outline" size={16} color={colors.success} />
                </View>
                <View style={styles.checklistContent}>
                  <Text style={styles.checklistTitle}>Дождись предложения</Text>
                  <Text style={styles.checklistSubtitle}>Супервайзер назначит тебя на объект</Text>
                </View>
              </View>
            </View>

            {/* CTA button */}
            <Pressable
              style={styles.fillProfileButton}
              onPress={() => navigation?.navigate('Profile')}
            >
              <Text style={styles.fillProfileButtonText}>Заполнить профиль</Text>
            </Pressable>
          </Card>
        </AnimatedEntry>
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 120 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  verificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    ...typography.bodyBold,
    color: colors.warning,
    marginBottom: 2,
  },
  verificationText: {
    ...typography.small,
    color: colors.textLight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  taskCard: {
    marginBottom: spacing.md,
  },
  taskCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  taskCardRejected: {
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deadline: {
    ...typography.small,
    color: colors.textLight,
  },
  taskTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  projectTitle: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  address: {
    ...typography.small,
    color: colors.textLight,
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  checklistContainer: {
    width: '100%',
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  checklistItemLast: {
    borderBottomWidth: 0,
  },
  checklistBullet: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 1,
  },
  checklistSubtitle: {
    ...typography.small,
    color: colors.textLight,
  },
  fillProfileButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  fillProfileButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  retryText: {
    ...typography.small,
    color: colors.primary,
  },
});
