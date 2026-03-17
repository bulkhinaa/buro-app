import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useMasterStore } from '../../store/masterStore';
import { useTaskStore, type TaskItem } from '../../store/taskStore';
import { useTranslation } from 'react-i18next';

export function MasterHomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const profile = useMasterStore((s) => s.profile);
  const { tasks, loadTasks } = useTaskStore();

  const isVerified = profile?.verification_status === 'approved';
  const completedCount = profile?.completed_tasks || 12;
  const rating = profile?.rating || 4.9;

  useEffect(() => {
    if (user) loadTasks(user.id);
  }, [user]);

  const handleTaskPress = (task: TaskItem) => {
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
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{t('master.home.yourTasks')}</Text>
        <Text style={styles.greetingName}>{user?.name || t('master.home.masterFallback')}</Text>
      </View>

      {/* Verification banner */}
      {!isVerified && (
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
        <Card style={styles.emptyCard}>
          <Ionicons name="checkmark-done-outline" size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyText}>{t('master.home.allDone')}</Text>
          <Text style={styles.emptySubtext}>
            {t('master.home.awaitAssignments')}
          </Text>
        </Card>
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 120 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  greetingText: {
    ...typography.body,
    color: colors.textLight,
  },
  greetingName: {
    ...typography.h1,
    color: colors.heading,
  },
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
