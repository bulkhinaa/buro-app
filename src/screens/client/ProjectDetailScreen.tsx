import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  StatusBadge,
  Button,
  Chip,
  ProgressBar,
  CellIndicator,
  LabelMaster,
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useProjectStore } from '../../store/projectStore';
import { Project, Stage, REPAIR_TYPE_LABELS } from '../../types';
import { formatRubles, formatTimeline, estimateTimelineDays } from '../../utils/calculator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  new: 'Ваша заявка принята. Ожидайте назначения супервайзера',
  planning: 'Супервайзер составляет план работ',
  in_progress: 'Ремонт в процессе',
  completed: 'Ремонт завершён!',
  cancelled: 'Проект отменён',
};

export function ProjectDetailScreen({ navigation, route }: Props) {
  const { projectId, project } = (route.params || {}) as {
    projectId: string;
    project?: Project;
  };
  const { stages, loadStages, isLoading } = useProjectStore();

  useEffect(() => {
    if (projectId) loadStages(projectId);
  }, [projectId]);

  const completedCount = stages.filter((s) => s.status === 'approved').length;
  const progress =
    stages.length > 0
      ? Math.round((completedCount / stages.length) * 100)
      : 0;

  const renderStage = ({ item }: { item: Stage }) => (
    <View style={styles.stageItem}>
      <View style={styles.stageLeft}>
        <View
          style={[
            styles.stageDot,
            item.status === 'approved' && styles.stageDotDone,
            item.status === 'in_progress' && styles.stageDotActive,
            item.status === 'done_by_master' && styles.stageDotPending,
          ]}
        />
        <View style={styles.stageLine} />
      </View>
      <View style={styles.stageContent}>
        <View style={styles.stageHeader}>
          <Text
            style={[
              styles.stageTitle,
              item.status === 'approved' && styles.stageTitleDone,
            ]}
          >
            {item.order_index}. {item.title}
          </Text>
          <StatusBadge status={item.status} />
        </View>
        {item.deadline && (
          <Text style={styles.stageDeadline}>
            до {new Date(item.deadline).toLocaleDateString('ru-RU')}
          </Text>
        )}
        {item.status === 'done_by_master' && (
          <Button
            title="Подтвердить"
            onPress={() =>
              navigation.navigate('StageApproval', {
                stageId: item.id,
                stageTitle: item.title,
                stageIndex: item.order_index,
                projectTitle: project?.title,
              })
            }
            size="sm"
            style={{ marginTop: spacing.sm }}
          />
        )}
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      {/* Status */}
      <View style={styles.statusSection}>
        <StatusBadge
          status={project?.status || 'new'}
          type="project"
        />
        <Text style={styles.statusDescription}>
          {STATUS_DESCRIPTIONS[project?.status || 'new']}
        </Text>
      </View>

      {/* Object info */}
      <View style={styles.infoSection}>
        <CellIndicator
          variant="row"
          label="Адрес"
          value={project?.address || ''}
        />
        {project?.area_sqm != null && (
          <CellIndicator
            variant="row"
            label="Площадь"
            value={`${project.area_sqm} м²`}
          />
        )}
        {project?.repair_type && (
          <CellIndicator
            variant="row"
            label="Тип ремонта"
            value={REPAIR_TYPE_LABELS[project.repair_type]}
          />
        )}
        {project?.budget_min != null && project?.budget_max != null && (
          <CellIndicator
            variant="row"
            label="Бюджет"
            value={`${formatRubles(project.budget_min)} – ${formatRubles(project.budget_max)}`}
          />
        )}
        {project?.repair_type && project?.area_sqm && (
          <CellIndicator
            variant="row"
            label="Сроки"
            value={formatTimeline(
              estimateTimelineDays(project.repair_type, project.area_sqm),
            )}
          />
        )}
      </View>

      {/* Supervisor (mock) */}
      {project?.supervisor_id && (
        <>
          <Text style={styles.sectionTitle}>Ваш супервайзер</Text>
          <Card style={styles.supervisorCard}>
            <View style={styles.supervisorRow}>
              <View style={styles.supervisorAvatar}>
                <Ionicons name="person" size={20} color={colors.white} />
              </View>
              <View style={styles.supervisorInfo}>
                <Text style={styles.supervisorName}>Алексей Петров</Text>
                <LabelMaster level="expert" rating={4.9} reviewCount={87} />
              </View>
            </View>
            <Button
              title="Написать"
              onPress={() => navigation.navigate('Chat', { projectId })}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </>
      )}

      {/* Progress */}
      {stages.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Прогресс ремонта</Text>
          <Card style={styles.progressCard}>
            <ProgressBar
              progress={progress / 100}
              label="Прогресс"
              showPercentage
            />
            <Text style={styles.progressDetail}>
              {completedCount} из {stages.length} этапов завершено
            </Text>
          </Card>
        </>
      )}

      {/* Stages timeline */}
      <Text style={styles.sectionTitle}>Этапы ремонта</Text>

      <FlatList
        data={stages}
        renderItem={renderStage}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          isLoading ? (
            <Text style={styles.loadingText}>Загрузка этапов...</Text>
          ) : (
            <Text style={styles.loadingText}>
              Этапы будут добавлены после назначения супервайзера
            </Text>
          )
        }
      />

      {/* Chat button */}
      {project?.status === 'in_progress' && (
        <Button
          title="Открыть чат"
          onPress={() => navigation.navigate('Chat', { projectId })}
          variant="outline"
          fullWidth
          style={{ marginTop: spacing.xl, marginBottom: spacing.huge }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statusSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  statusDescription: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  infoSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  supervisorCard: {
    marginBottom: spacing.xxl,
  },
  supervisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supervisorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  progressCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.xxl,
  },
  progressDetail: {
    ...typography.small,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  stageItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  stageLeft: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stageDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  stageDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stageDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stageDotPending: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  stageLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  stageContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stageTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
    marginRight: spacing.sm,
  },
  stageTitleDone: {
    color: colors.textLight,
  },
  stageDeadline: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
