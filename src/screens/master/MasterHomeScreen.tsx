import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge, EmptyStateIllustration, AnimatedEntry, SharedHeader } from '../../components';
import { colors, spacing, radius, typography, glass } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useMasterStore } from '../../store/masterStore';
import { useTaskStore, type TaskItem } from '../../store/taskStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useTranslation } from 'react-i18next';
import { trackTap } from '../../services/analyticsService';

// Jump Finance Edge Function is not deployed yet (missing JUMP_FINANCE_CLIENT_KEY secret).
// Set to true once the function is deployed and tested.
const JUMP_FINANCE_ENABLED = false;

export function MasterHomeScreen({ navigation }: any) {
  const { colors: themeColors, glass, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const profile = useMasterStore((s) => s.profile);
  const { tasks, loadTasks } = useTaskStore();
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.is_read).length);

  const isVerified = profile?.verification_status === 'approved';
  const completedCount = profile?.completed_tasks ?? 0;
  const rating = profile?.rating ?? 0;

  useEffect(() => {
    if (user) {
      loadTasks(user.id);
      useNotificationStore.getState().loadNotifications(user.id);
    }
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

      {/* Empty state */}
      {tasks.length === 0 && (
        <AnimatedEntry index={0}>
          <Card style={styles.emptyCard}>
            <EmptyStateIllustration
              variant="no-tasks"
              title={t('master.home.allDone')}
              subtitle={t('master.home.awaitAssignments')}
            />
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
    borderColor: colors.warning,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  verificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
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
    backgroundColor: glass.fill.regular,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: glass.border.light,
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
  },
  emptyText: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
});
