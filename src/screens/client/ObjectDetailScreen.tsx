import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Button,
  Card,
  CellIndicator,
  StatusBadge,
  SystemButton,
  ProgressBar,
  Chip,
  AppDialog,
} from '../../components';
import type { DialogButton } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useObjectStore } from '../../store/objectStore';
import { useProjectStore } from '../../store/projectStore';
import { useToastStore } from '../../store/toastStore';
import { fetchObjectProjects } from '../../services/projectService';
import { getLayoutById } from '../../data/layouts';
import {
  PropertyObject,
  Project,
  ROOM_COUNT_LABELS,
  BATHROOM_LABELS,
  KITCHEN_TYPE_LABELS,
  RENOVATION_GOAL_LABELS,
  PROPERTY_TYPE_LABELS,
  REPAIR_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
} from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export function ObjectDetailScreen({ navigation, route }: Props) {
  const object = route.params?.object as PropertyObject | undefined;
  const { removeObject } = useObjectStore();
  const showToast = useToastStore((s) => s.show);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState<string | undefined>('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const layout = object?.layout_id ? getLayoutById(object.layout_id) : null;

  useEffect(() => {
    if (!object) return;
    loadProjects();
  }, [object]);

  const loadProjects = useCallback(async () => {
    if (!object) return;
    setLoadingProjects(true);
    try {
      // Dev objects — use local project store
      if (object.id.startsWith('obj-')) {
        // For dev mode, filter projects by address match
        const store = useProjectStore.getState();
        const matched = store.projects.filter(
          (p) => p.object_id === object.id,
        );
        setProjects(matched);
      } else {
        const data = await fetchObjectProjects(object.id);
        setProjects(data);
      }
    } catch {
      // Ignore errors loading projects
    } finally {
      setLoadingProjects(false);
    }
  }, [object]);

  const performDelete = useCallback(async () => {
    if (!object || deleting) return;
    setDialogVisible(false);
    setDeleting(true);
    try {
      await removeObject(object.id);
      showToast('Объект удалён', 'success');
      navigation.goBack();
    } catch {
      showToast('Не удалось удалить объект', 'error');
      setDeleting(false);
    }
  }, [object, deleting, removeObject, showToast, navigation]);

  const handleDelete = useCallback(() => {
    setDialogTitle('Удалить объект');
    setDialogMessage('Вы уверены? Все проекты этого объекта останутся в системе.');
    setDialogButtons([
      { text: 'Отмена', style: 'cancel', onPress: () => setDialogVisible(false) },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: performDelete,
      },
    ]);
    setDialogVisible(true);
  }, [performDelete]);

  const handleCreateProject = useCallback(() => {
    if (!object) return;
    navigation.navigate('CreateProject', {
      objectId: object.id,
      objectAddress: object.address,
      objectArea: object.total_area,
    });
  }, [object, navigation]);

  if (!object) {
    return (
      <ScreenWrapper>
        <Text style={styles.errorText}>Объект не найден</Text>
      </ScreenWrapper>
    );
  }

  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const activeProjects = projects.filter(
    (p) => p.status === 'in_progress' || p.status === 'planning',
  ).length;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }} />
        <SystemButton
          type="more"
          onPress={handleDelete}
        />
      </View>

      {/* Layout SVG */}
      {layout ? (
        <View style={styles.layoutSection}>
          <View style={styles.layoutSvgContainer}>
            <SvgXml xml={layout.svg} width={180} height={180} />
          </View>
          <Text style={styles.layoutName}>{layout.name}</Text>
        </View>
      ) : object.custom_layout_url ? (
        <View style={styles.layoutSection}>
          <Ionicons name="image-outline" size={48} color={colors.textLight} />
          <Text style={styles.layoutName}>Своя планировка</Text>
        </View>
      ) : (
        <View style={styles.layoutSection}>
          <View style={styles.noLayoutIcon}>
            <Ionicons name="home-outline" size={48} color={colors.textLight} />
          </View>
        </View>
      )}

      {/* Address */}
      <Text style={styles.address}>{object.address}</Text>

      {/* Info card */}
      <View style={styles.infoCard}>
        <CellIndicator
          variant="row"
          label="Тип"
          value={PROPERTY_TYPE_LABELS[object.property_type]}
        />
        <CellIndicator
          variant="row"
          label="Площадь"
          value={`${object.total_area} м²`}
        />
        <CellIndicator
          variant="row"
          label="Комнат"
          value={ROOM_COUNT_LABELS[object.rooms]}
        />
        <CellIndicator
          variant="row"
          label="Санузлы"
          value={BATHROOM_LABELS[object.bathrooms]}
        />
        <CellIndicator
          variant="row"
          label="Кухня"
          value={KITCHEN_TYPE_LABELS[object.kitchen_type]}
        />
        <CellIndicator
          variant="row"
          label="Цель"
          value={RENOVATION_GOAL_LABELS[object.renovation_goal]}
        />
        {layout && (
          <CellIndicator
            variant="row"
            label="Планировка"
            value={layout.name}
          />
        )}
      </View>

      {/* Projects section */}
      <View style={styles.projectsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Проекты</Text>
          {projects.length > 0 && (
            <Text style={styles.projectCount}>
              {activeProjects > 0 ? `${activeProjects} активных` : `${completedProjects} завершённых`}
            </Text>
          )}
        </View>

        {projects.length === 0 ? (
          <View style={styles.emptyProjects}>
            <Ionicons name="hammer-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Нет проектов</Text>
            <Text style={styles.emptySubtext}>
              Создайте первый проект ремонта для этого объекта
            </Text>
          </View>
        ) : (
          projects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() =>
                navigation.navigate('ProjectDetail', {
                  projectId: project.id,
                  project,
                })
              }
            >
              <View style={styles.projectCard}>
                <View style={styles.projectCardHeader}>
                  <StatusBadge status={project.status} />
                  <Text style={styles.projectTitle} numberOfLines={1}>
                    {project.title}
                  </Text>
                </View>
                <View style={styles.projectCardMeta}>
                  <Chip
                    label={REPAIR_TYPE_LABELS[project.repair_type]}
                    size="sm"
                  />
                  {project.budget_min && project.budget_max && (
                    <Text style={styles.projectBudget}>
                      {Math.round(project.budget_min / 1000)}–
                      {Math.round(project.budget_max / 1000)} тыс. ₽
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* CTA */}
      <Button
        title="Новый проект"
        onPress={handleCreateProject}
        fullWidth
        icon={<Ionicons name="add" size={20} color={colors.white} />}
      />

      <View style={{ height: 40 }} />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  layoutSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  layoutSvgContainer: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.sm,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  layoutName: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  noLayoutIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  address: {
    ...typography.h2,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.md,
    marginBottom: spacing.xxl,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  projectsSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
  },
  projectCount: {
    ...typography.small,
    color: colors.textLight,
  },
  emptyProjects: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.heading,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxl,
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    marginBottom: spacing.md,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  projectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  projectTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
  },
  projectCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  projectBudget: {
    ...typography.small,
    color: colors.textLight,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
