import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge, SearchInput, GlassChip, Button, AppDialog } from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess, hapticLight } from '../../utils/haptics';
import { colors, spacing, typography, radius } from '../../theme';
import { Project, REPAIR_TYPE_LABELS, PROJECT_STATUS_LABELS } from '../../types';
import { useAdminStore, MOCK_PROJECTS, type ProjectFilter } from '../../store/adminStore';
import { fetchAllProjects, assignSupervisor, updateProjectStatus, fetchUsersByRole } from '../../services/projectService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

const FILTER_OPTIONS: { key: ProjectFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'planning', label: 'Планирование' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'completed', label: 'Завершённые' },
  { key: 'cancelled', label: 'Отклонённые' },
];

export function AdminRequestsScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isDev = user?.id.startsWith('dev-');

  const allProjects = useAdminStore((s) => s.projects);
  const filter = useAdminStore((s) => s.projectFilter);
  const search = useAdminStore((s) => s.projectSearch);

  const projects = useMemo(() => {
    let filtered = allProjects;
    if (filter !== 'all') {
      filtered = filtered.filter((p) => p.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [allProjects, filter, search]);
  const setProjects = useAdminStore((s) => s.setProjects);
  const setFilter = useAdminStore((s) => s.setProjectFilter);
  const setSearch = useAdminStore((s) => s.setProjectSearch);

  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<{ id: string; name: string }[]>([]);

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
    setLoading(true);
    try {
      if (isDev) {
        setProjects(MOCK_PROJECTS);
        setSupervisors([
          { id: 'sv-1', name: 'Алексеев П.И.' },
          { id: 'sv-2', name: 'Борисова Е.А.' },
          { id: 'sv-3', name: 'Григорьев М.С.' },
        ]);
      } else {
        const [projectsData, svData] = await Promise.all([
          fetchAllProjects(),
          fetchUsersByRole('supervisor'),
        ]);
        setProjects(projectsData);
        setSupervisors(svData.map((sv) => ({ id: sv.id, name: sv.name || 'Без имени' })));
      }
    } catch {
      setProjects(MOCK_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, [isDev, setProjects]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = (project: Project) => {
    const svButtons: DialogButton[] = supervisors.map((sv) => ({
      text: sv.name,
      onPress: async () => {
        try {
          if (!isDev) await assignSupervisor(project.id, sv.id);
          // Update local state
          setProjects(
            useAdminStore.getState().projects.map((p) =>
              p.id === project.id
                ? { ...p, supervisor_id: sv.id, status: 'planning' as const }
                : p,
            ),
          );
          hapticSuccess();
          showToast(`Супервайзер ${sv.name} назначен`, 'success');
        } catch {
          showToast('Ошибка при назначении', 'error');
        }
      },
    }));
    svButtons.push({ text: 'Отмена', style: 'cancel', onPress: () => {} });
    showDialog('Выберите супервайзера', `Проект: ${project.title}`, svButtons);
  };

  const handleReject = (project: Project) => {
    showDialog('Отклонить заявку?', project.title, [
      {
        text: 'Отклонить',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!isDev) await updateProjectStatus(project.id, 'cancelled');
            setProjects(
              useAdminStore.getState().projects.map((p) =>
                p.id === project.id ? { ...p, status: 'cancelled' as const } : p,
              ),
            );
            hapticSuccess();
            showToast('Заявка отклонена', 'info');
          } catch {
            showToast('Ошибка при отклонении', 'error');
          }
        },
      },
      { text: 'Нет', style: 'cancel', onPress: () => {} },
    ]);
  };

  const renderProject = ({ item }: { item: Project }) => (
    <Pressable
      onPress={() => navigation.navigate('AdminRequestDetail', { projectId: item.id })}
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <StatusBadge status={item.status} type="project" />
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString('ru-RU')}
          </Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardAddress}>
          {item.address} · {item.area_sqm} м² · {REPAIR_TYPE_LABELS[item.repair_type]}
        </Text>

        {item.budget_min && item.budget_max ? (
          <Text style={styles.cardBudget}>
            {item.budget_min.toLocaleString('ru-RU')} – {item.budget_max.toLocaleString('ru-RU')} ₽
          </Text>
        ) : null}

        {item.status === 'new' && (
          <View style={styles.cardActions}>
            <Button
              title="Назначить"
              onPress={() => handleAssign(item)}
              size="sm"
            />
            <Button
              title="Отклонить"
              onPress={() => handleReject(item)}
              variant="ghost"
              size="sm"
            />
          </View>
        )}
      </Card>
    </Pressable>
  );

  const statusCounts = allProjects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Заявки</Text>
        <Text style={styles.subtitle}>
          Всего: {allProjects.length}
        </Text>
      </View>

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Поиск по названию или адресу..."
      />

      <View style={styles.filters}>
        {FILTER_OPTIONS.map((opt) => {
          const count =
            opt.key === 'all'
              ? allProjects.length
              : statusCounts[opt.key] || 0;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                setFilter(opt.key);
                hapticLight();
              }}
            >
              <GlassChip
                label={`${opt.label}${count > 0 ? ` (${count})` : ''}`}
                active={filter === opt.key}
              />
            </Pressable>
          );
        })}
      </View>

      {projects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <Text style={styles.emptyText}>Нет заявок</Text>
          <Text style={styles.emptySubtext}>
            {filter !== 'all'
              ? `Нет заявок со статусом «${FILTER_OPTIONS.find((f) => f.key === filter)?.label}»`
              : 'Заявки появятся здесь'}
          </Text>
        </Card>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
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
  container: {
    paddingBottom: 24,
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: 2,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  cardDate: {
    ...typography.small,
    color: colors.textLight,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  cardAddress: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  cardBudget: {
    ...typography.small,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
