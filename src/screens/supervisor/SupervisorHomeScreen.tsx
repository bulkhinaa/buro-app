import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge, Button, AppDialog, MapPreview, ProgressBar } from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess } from '../../utils/haptics';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { Project, REPAIR_TYPE_LABELS } from '../../types';
import { fetchSupervisorProjects, updateProjectStatus } from '../../services/projectService';

type ProjectItem = Project & {
  clientName: string;
  stagesTotal: number;
  stagesDone: number;
  pendingReview: number;
};

const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'sp-1',
    client_id: '1',
    supervisor_id: '2',
    title: 'Ремонт квартиры на Ленина 15',
    address: 'ул. Ленина, 15, кв. 42',
    area_sqm: 54,
    repair_type: 'standard',
    status: 'in_progress',
    created_at: '2025-01-15',
    updated_at: '2025-02-05',
    clientName: 'Иванов А.П.',
    stagesTotal: 14,
    stagesDone: 5,
    pendingReview: 1,
  },
  {
    id: 'sp-2',
    client_id: '4',
    supervisor_id: '2',
    title: 'Ремонт студии на Пушкина 8',
    address: 'ул. Пушкина, 8, кв. 12',
    area_sqm: 32,
    repair_type: 'cosmetic',
    status: 'planning',
    created_at: '2025-02-01',
    updated_at: '2025-02-03',
    clientName: 'Петрова М.С.',
    stagesTotal: 14,
    stagesDone: 0,
    pendingReview: 0,
  },
];

export function SupervisorHomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);

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
      const data = await fetchSupervisorProjects(user.id);
      if (data.length > 0) {
        setProjects(
          data.map((p) => ({
            ...p,
            clientName: p.title,
            stagesTotal: 14,
            stagesDone: 0,
            pendingReview: 0,
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

  const handleApproveStage = (project: ProjectItem) => {
    if (project.pendingReview <= 0) {
      showDialog(
        'Нет этапов на проверке',
        'Все этапы в порядке',
        [{ text: 'OK', onPress: () => {} }],
      );
      return;
    }
    showDialog(
      'Принять этап?',
      `Проект: ${project.title}\nЭтап ожидает проверки.`,
      [
        {
          text: 'Принять ✓',
          onPress: () => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === project.id
                  ? {
                      ...p,
                      stagesDone: p.stagesDone + 1,
                      pendingReview: p.pendingReview - 1,
                    }
                  : p,
              ),
            );
            hapticSuccess();
            showDialog(
              'Этап принят',
              'Клиент и мастер получат уведомление',
              [{ text: 'OK', onPress: () => {} }],
            );
          },
        },
        {
          text: 'Отклонить ✗',
          style: 'destructive',
          onPress: () => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === project.id
                  ? { ...p, pendingReview: p.pendingReview - 1 }
                  : p,
              ),
            );
            showDialog(
              'Отклонён',
              'Мастеру отправлен запрос на доработку',
              [{ text: 'OK', onPress: () => {} }],
            );
          },
        },
        { text: 'Отмена', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  const handleComplete = (project: ProjectItem) => {
    showDialog(
      'Завершить проект?',
      `${project.title}\n${project.stagesDone}/${project.stagesTotal} этапов выполнено`,
      [
        {
          text: 'Завершить',
          onPress: async () => {
            try {
              await updateProjectStatus(project.id, 'completed');
            } catch {
              // DEV mode
            }
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
            showDialog(
              'Проект завершён',
              'Клиент получит уведомление',
              [{ text: 'OK', onPress: () => {} }],
            );
          },
        },
        { text: 'Нет', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  const activeCount = projects.filter((p) => p.status === 'in_progress').length;
  const reviewCount = projects.reduce((sum, p) => sum + p.pendingReview, 0);

  const renderProject = ({ item }: { item: ProjectItem }) => {
    const progress =
      item.stagesTotal > 0
        ? Math.round((item.stagesDone / item.stagesTotal) * 100)
        : 0;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <StatusBadge status={item.status} type="project" />
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardAddress}>
          {item.address} · {item.area_sqm} м² · {REPAIR_TYPE_LABELS[item.repair_type]}
        </Text>

        <MapPreview address={item.address} />

        <View style={styles.progressRow}>
          <View style={{ flex: 1 }}>
            <ProgressBar progress={progress / 100} />
          </View>
          <Text style={styles.progressText}>
            {item.stagesDone}/{item.stagesTotal}
          </Text>
        </View>

        <View style={styles.actions}>
          {item.pendingReview > 0 && (
            <Button
              title={`Проверить (${item.pendingReview})`}
              onPress={() => handleApproveStage(item)}
              size="sm"
            />
          )}
          {item.stagesDone === item.stagesTotal && item.stagesTotal > 0 && (
            <Button
              title="Завершить проект"
              onPress={() => handleComplete(item)}
              size="sm"
              variant="outline"
            />
          )}
          {item.pendingReview === 0 && item.stagesDone < item.stagesTotal && (
            <Text style={styles.statusNote}>Ожидание работ мастера</Text>
          )}
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Панель супервайзера</Text>
        <Text style={styles.greetingName}>{user?.name || 'Супервайзер'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.primary }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {activeCount}
          </Text>
          <Text style={styles.statLabel}>Активных проектов</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { borderColor: reviewCount > 0 ? colors.warning : colors.border },
          ]}
        >
          <Text
            style={[
              styles.statNumber,
              { color: reviewCount > 0 ? colors.warning : colors.textLight },
            ]}
          >
            {reviewCount}
          </Text>
          <Text style={styles.statLabel}>На проверке</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Мои проекты</Text>

      {projects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="clipboard-outline" size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyText}>Нет активных проектов</Text>
          <Text style={styles.emptySubtext}>
            Администратор назначит вам новые проекты
          </Text>
        </Card>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
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
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(123, 45, 62, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    ...typography.h1,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clientName: {
    ...typography.small,
    color: colors.textLight,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  cardAddress: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  statusNote: {
    ...typography.small,
    color: colors.textLight,
    fontStyle: 'italic',
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
