import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useMasterStore } from '../../store/masterStore';
import { Stage } from '../../types';
import { fetchMasterStages } from '../../services/projectService';

type TaskItem = Stage & { projectTitle: string; address: string; rejection_reason?: string };

const MOCK_TASKS: TaskItem[] = [
  {
    id: 'mt-1',
    project_id: '1',
    master_id: '3',
    title: 'Штукатурка стен',
    order_index: 4,
    status: 'in_progress',
    started_at: '2025-02-05',
    deadline: '2025-02-15',
    projectTitle: 'Ремонт квартиры на Ленина 15',
    address: 'ул. Ленина, 15, кв. 42',
  },
  {
    id: 'mt-2',
    project_id: '2',
    master_id: '3',
    title: 'Укладка плитки в ванной',
    order_index: 6,
    status: 'pending',
    deadline: '2025-02-25',
    projectTitle: 'Ремонт студии на Пушкина 8',
    address: 'ул. Пушкина, 8, кв. 12',
  },
  {
    id: 'mt-3',
    project_id: '1',
    master_id: '3',
    title: 'Электрика (чистовая)',
    order_index: 7,
    status: 'pending',
    deadline: '2025-03-01',
    projectTitle: 'Ремонт квартиры на Ленина 15',
    address: 'ул. Ленина, 15, кв. 42',
  },
];

export function MasterHomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const profile = useMasterStore((s) => s.profile);
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);

  const isVerified = profile?.verification_status === 'approved';
  const completedCount = profile?.completed_tasks || 12;
  const rating = profile?.rating || 4.9;

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const stages = await fetchMasterStages(user.id);
      if (stages.length > 0) {
        setTasks(
          stages.map((s) => ({
            ...s,
            projectTitle: '',
            address: '',
          })),
        );
      }
    } catch {
      // Dev mode fallback — use mock data
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        <Text style={styles.greetingText}>Ваши задачи,</Text>
        <Text style={styles.greetingName}>{user?.name || 'Мастер'}</Text>
      </View>

      {/* Verification banner */}
      {!isVerified && (
        <Pressable style={styles.verificationBanner}>
          <View style={styles.verificationIcon}>
            <Ionicons name="shield-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Профиль не верифицирован</Text>
            <Text style={styles.verificationText}>
              Пройдите верификацию как самозанятый, чтобы получать задачи
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeTasks.length}</Text>
          <Text style={styles.statLabel}>Активных</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Завершённых</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            <Ionicons name="star" size={16} color={colors.primary} /> {rating}
          </Text>
          <Text style={styles.statLabel}>Рейтинг</Text>
        </View>
      </View>

      {/* Rejected tasks */}
      {rejectedTasks.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            Требуют доработки ({rejectedTasks.length})
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
          <Text style={styles.sectionTitle}>В работе ({activeTasks.length})</Text>
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
          <Text style={styles.sectionTitle}>Ожидают ({pendingTasks.length})</Text>
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
          <Text style={styles.emptyText}>Все задачи выполнены</Text>
          <Text style={styles.emptySubtext}>
            Ожидайте новые назначения от супервайзера
          </Text>
        </Card>
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 100 }} />
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
