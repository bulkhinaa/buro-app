import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge, Button, AppDialog, MapPreview } from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess } from '../../utils/haptics';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { Stage, STAGE_STATUS_LABELS } from '../../types';
import { fetchMasterStages, updateStageStatus } from '../../services/projectService';

type TaskItem = Stage & { projectTitle: string; address: string };

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
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [completedCount, setCompletedCount] = useState(12);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const showDialog = (title: string, message: string, buttons: DialogButton[]) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogVisible(true);
  };

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
      // DEV mode fallback
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStart = (item: TaskItem) => {
    showDialog(
      'Начать работу?',
      `Задача: ${item.title}\n${item.projectTitle}`,
      [
        {
          text: 'Начать',
          onPress: async () => {
            try {
              await updateStageStatus(item.id, 'in_progress');
            } catch {
              // DEV mode
            }
            setTasks((prev) =>
              prev.map((t) =>
                t.id === item.id
                  ? { ...t, status: 'in_progress' as const, started_at: new Date().toISOString() }
                  : t,
              ),
            );
            hapticSuccess();
          },
        },
        { text: 'Нет', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  const handleComplete = (item: TaskItem) => {
    showDialog(
      'Отметить выполнение?',
      `Задача: ${item.title}\nСупервайзер проверит результат.`,
      [
        {
          text: 'Выполнено ✓',
          onPress: async () => {
            try {
              await updateStageStatus(item.id, 'done_by_master');
            } catch {
              // DEV mode
            }
            setTasks((prev) => prev.filter((t) => t.id !== item.id));
            setCompletedCount((c) => c + 1);
            hapticSuccess();
            showDialog(
              'Отправлено',
              'Задача отправлена на проверку супервайзеру',
              [{ text: 'OK', onPress: () => {} }],
            );
          },
        },
        { text: 'Нет', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  const activeTasks = tasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  const renderTask = ({ item }: { item: TaskItem }) => {
    const isActive = item.status === 'in_progress';

    return (
      <Card style={[styles.taskCard, isActive && styles.taskCardActive]}>
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
        <Text style={styles.address}>{item.address}</Text>

        <MapPreview address={item.address} />

        <View style={styles.actions}>
          {item.status === 'pending' && (
            <Button
              title="Начать работу"
              onPress={() => handleStart(item)}
              size="sm"
              variant="outline"
            />
          )}
          {item.status === 'in_progress' && (
            <Button
              title="Выполнено ✓"
              onPress={() => handleComplete(item)}
              size="sm"
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Ваши задачи,</Text>
        <Text style={styles.greetingName}>{user?.name || 'Мастер'}</Text>
      </View>

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
          <Text style={[styles.statNumber, { color: colors.warning }]}>★ 4.9</Text>
          <Text style={styles.statLabel}>Рейтинг</Text>
        </View>
      </View>

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

      {tasks.length === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="checkmark-done-outline" size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyText}>Все задачи выполнены</Text>
          <Text style={styles.emptySubtext}>
            Ожидайте новые назначения от супервайзера
          </Text>
        </Card>
      )}

      <AppDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: spacing.xxl,
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: 2,
  },
  address: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  // emptyIcon style removed — now using Ionicons inline
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
