import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge, Button, AppDialog, SystemButton } from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess } from '../../utils/haptics';
import { colors, spacing, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Project, REPAIR_TYPE_LABELS, PROJECT_STATUS_LABELS } from '../../types';
import { useAdminStore, MOCK_PROJECTS } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  fetchProjectWithClient,
  assignSupervisor,
  updateProjectStatus,
  fetchUsersByRole,
  fetchProjectStages,
} from '../../services/projectService';

interface ProjectDetail extends Project {
  client_name?: string;
  client_phone?: string;
  supervisor_name?: string;
}

export function AdminRequestDetailScreen({ route, navigation }: any) {
  const { colors: themeColors, glass, isDark } = useTheme();
  const { projectId } = route.params;
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isDev = user?.id.startsWith('dev-');

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [supervisors, setSupervisors] = useState<{ id: string; name: string }[]>([]);
  const [stagesCount, setStagesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dialog
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

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isDev) {
        const mockProject = MOCK_PROJECTS.find((p) => p.id === projectId);
        if (mockProject) {
          setProject({
            ...mockProject,
            client_name: 'Тестовый клиент',
            client_phone: '+7 (999) 000-00-00',
            supervisor_name: mockProject.supervisor_id
              ? 'Алексеев П.И.'
              : undefined,
          });
        }
        setSupervisors([
          { id: 'sv-1', name: 'Алексеев П.И.' },
          { id: 'sv-2', name: 'Борисова Е.А.' },
          { id: 'sv-3', name: 'Григорьев М.С.' },
        ]);
        setStagesCount(14);
      } else {
        const [projectData, svData, stages] = await Promise.all([
          fetchProjectWithClient(projectId),
          fetchUsersByRole('supervisor'),
          fetchProjectStages(projectId),
        ]);
        setProject(projectData);
        setSupervisors(svData.map((sv) => ({ id: sv.id, name: sv.name || 'Без имени' })));
        setStagesCount(stages.length);
      }
    } catch (e: any) {
      showToast('Ошибка загрузки', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSupervisor = () => {
    if (!project) return;
    const svButtons: DialogButton[] = supervisors.map((sv) => ({
      text: sv.name,
      onPress: async () => {
        try {
          if (!isDev) await assignSupervisor(project.id, sv.id);
          setProject({
            ...project,
            supervisor_id: sv.id,
            supervisor_name: sv.name,
            status: 'planning',
          });
          // Update store
          useAdminStore.getState().setProjects(
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

  const handleChangeStatus = (newStatus: string, label: string) => {
    if (!project) return;
    showDialog(`${label}?`, project.title, [
      {
        text: label,
        style: newStatus === 'cancelled' ? 'destructive' : undefined,
        onPress: async () => {
          try {
            if (!isDev) await updateProjectStatus(project.id, newStatus);
            setProject({ ...project, status: newStatus as any });
            useAdminStore.getState().setProjects(
              useAdminStore.getState().projects.map((p) =>
                p.id === project.id ? { ...p, status: newStatus as any } : p,
              ),
            );
            hapticSuccess();
            showToast(`Статус изменён: ${label}`, 'success');
          } catch {
            showToast('Ошибка при изменении статуса', 'error');
          }
        },
      },
      { text: 'Отмена', style: 'cancel', onPress: () => {} },
    ]);
  };

  if (loading || !project) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.backRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Project header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{project.title}</Text>
          <StatusBadge status={project.status} type="project" />
        </View>

        {/* Info cards */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Информация о проекте</Text>

          <InfoRow icon="location-outline" label="Адрес" value={project.address} />
          <InfoRow icon="resize-outline" label="Площадь" value={`${project.area_sqm} м²`} />
          <InfoRow
            icon="construct-outline"
            label="Тип ремонта"
            value={REPAIR_TYPE_LABELS[project.repair_type]}
          />
          {project.budget_min && project.budget_max ? (
            <InfoRow
              icon="card-outline"
              label="Бюджет"
              value={`${project.budget_min.toLocaleString('ru-RU')} – ${project.budget_max.toLocaleString('ru-RU')} ₽`}
            />
          ) : null}
          <InfoRow
            icon="calendar-outline"
            label="Создан"
            value={new Date(project.created_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
          {stagesCount > 0 && (
            <InfoRow
              icon="list-outline"
              label="Этапы"
              value={`${stagesCount} этапов`}
            />
          )}
        </Card>

        {/* Client info */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Клиент</Text>
          <InfoRow
            icon="person-outline"
            label="Имя"
            value={project.client_name || 'Не указано'}
          />
          <InfoRow
            icon="call-outline"
            label="Телефон"
            value={project.client_phone || 'Не указан'}
          />
        </Card>

        {/* Supervisor info */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Супервайзер</Text>
          {project.supervisor_name ? (
            <InfoRow
              icon="shield-checkmark-outline"
              label="Назначен"
              value={project.supervisor_name}
            />
          ) : (
            <Text style={styles.noSupervisor}>Не назначен</Text>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {!project.supervisor_id && project.status === 'new' && (
            <Button
              title="Назначить супервайзера"
              onPress={handleAssignSupervisor}
              fullWidth
              icon={<Ionicons name="person-add-outline" size={18} color={colors.white} />}
            />
          )}

          {project.status === 'new' && (
            <Button
              title="Отклонить заявку"
              onPress={() => handleChangeStatus('cancelled', 'Отклонить')}
              variant="outline"
              fullWidth
            />
          )}

          {project.status === 'in_progress' && (
            <Button
              title="Завершить проект"
              onPress={() => handleChangeStatus('completed', 'Завершить')}
              fullWidth
            />
          )}

          {project.status === 'cancelled' && (
            <Button
              title="Восстановить заявку"
              onPress={() => handleChangeStatus('new', 'Восстановить')}
              variant="outline"
              fullWidth
            />
          )}

          {(project.status === 'in_progress' || project.status === 'planning') && (
            <Button
              title="Оплата"
              onPress={() => navigation.navigate('AdminPayment', { projectId: project.id })}
              variant="outline"
              fullWidth
              icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
            />
          )}
        </View>
      </ScrollView>

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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  backRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    ...typography.body,
    color: colors.textLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.heading,
    flex: 1,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.small,
    color: colors.textLight,
    width: 80,
  },
  infoValue: {
    ...typography.body,
    color: colors.heading,
    flex: 1,
  },
  noSupervisor: {
    ...typography.body,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
