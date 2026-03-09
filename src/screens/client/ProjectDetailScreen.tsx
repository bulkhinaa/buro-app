import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  Button,
  Chip,
  ProgressBar,
  LabelMaster,
  StageAccordion,
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { fetchProfile } from '../../services/projectService';
import {
  Project,
  REPAIR_TYPE_LABELS,
  RENOVATION_SCOPE_LABELS,
  PROJECT_STATUS_LABELS,
  RenovationScope,
} from '../../types';
import {
  formatRubles,
  formatTimeline,
  estimateTimelineDays,
} from '../../utils/calculator';
import { getStageBreakdown } from '../../data/stageBreakdown';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const HERO_DOT_COLORS: Record<string, string> = {
  new: '#FFD700',
  planning: '#FFA500',
  in_progress: '#34C759',
  completed: '#FFFFFF',
  cancelled: '#FF6B6B',
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
  const { user } = useAuthStore();
  const { stages, loadStages } = useProjectStore();
  const [supervisorName, setSupervisorName] = useState('Загрузка...');

  useEffect(() => {
    if (projectId) loadStages(projectId);
  }, [projectId]);

  // Fetch supervisor profile
  useEffect(() => {
    if (!project?.supervisor_id) return;

    const isDev = project.supervisor_id.startsWith('dev-') || user?.id.startsWith('dev-');
    if (isDev) {
      setSupervisorName('Михаил К.');
      return;
    }

    fetchProfile(project.supervisor_id)
      .then((profile) => {
        if (profile?.name) setSupervisorName(profile.name);
        else setSupervisorName('Назначен');
      })
      .catch(() => setSupervisorName('Назначен'));
  }, [project?.supervisor_id]);

  const completedCount = stages.filter((s) => s.status === 'approved').length;
  const totalStages = stages.length;
  const progress =
    totalStages > 0
      ? Math.round((completedCount / totalStages) * 100)
      : 0;
  const allStagesApproved = totalStages > 0 && completedCount === totalStages;

  // Collect unique master IDs from stages for ReviewScreen
  const mastersFromStages = useMemo(() => {
    const seen = new Set<string>();
    return stages
      .filter((s) => s.master_id && !seen.has(s.master_id!) && seen.add(s.master_id!))
      .map((s) => ({ id: s.master_id!, name: s.master_id!, specialization: s.title }));
  }, [stages]);

  // Generate breakdown for cost/time data per stage
  const stageBreakdown = useMemo(() => {
    if (project?.repair_type && project?.area_sqm) {
      return getStageBreakdown(project.repair_type, project.area_sqm);
    }
    return [];
  }, [project?.repair_type, project?.area_sqm]);

  const hasDbStages = stages.length > 0;

  const timelineDays =
    project?.repair_type && project?.area_sqm
      ? estimateTimelineDays(project.repair_type, project.area_sqm)
      : 0;

  // Scope chips (filter out 'full' — show individual rooms)
  const scopeItems: RenovationScope[] = (project?.scope || []).filter(
    (s): s is RenovationScope => s !== 'full',
  );

  return (
    <ScreenWrapper scroll={false} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── A. Hero section ─── */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBg}
          >
            {/* Decorative circles */}
            <View style={styles.heroDecor1} />
            <View style={styles.heroDecor2} />

            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <View style={[
                  styles.heroBadgeDot,
                  { backgroundColor: HERO_DOT_COLORS[project?.status || 'new'] || '#FFD700' },
                ]} />
                <Text style={styles.heroBadgeText}>
                  {PROJECT_STATUS_LABELS[project?.status || 'new']}
                </Text>
              </View>

              <Text style={styles.heroTitle} numberOfLines={2}>
                {project?.title || 'Загрузка...'}
              </Text>

              {project?.address ? (
                <View style={styles.heroAddressRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={styles.heroAddress} numberOfLines={1}>
                    {project.address}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.heroStatus}>
                {STATUS_DESCRIPTIONS[project?.status || 'new']}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ─── B. Info card ─── */}
        <Card style={styles.infoCard}>
          {/* Budget row */}
          {project?.budget_min != null && project?.budget_max != null && (
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Бюджет</Text>
              <Text style={styles.budgetValue}>
                {formatRubles(project.budget_min)} – {formatRubles(project.budget_max)}
              </Text>
            </View>
          )}

          {/* Details row */}
          <View style={styles.detailsRow}>
            {project?.area_sqm != null && (
              <View style={styles.detailItem}>
                <Ionicons name="resize-outline" size={16} color={colors.textLight} />
                <Text style={styles.detailText}>{project.area_sqm} м²</Text>
              </View>
            )}
            {project?.repair_type && (
              <View style={styles.detailItem}>
                <Ionicons name="construct-outline" size={16} color={colors.textLight} />
                <Text style={styles.detailText}>
                  {REPAIR_TYPE_LABELS[project.repair_type]}
                </Text>
              </View>
            )}
            {timelineDays > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={colors.accent} />
                <Text style={[styles.detailText, { color: colors.accent, fontWeight: '600' }]}>
                  {formatTimeline(timelineDays)}
                </Text>
              </View>
            )}
          </View>

          {/* Scope chips */}
          {scopeItems.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.scopeTitle}>Помещения</Text>
              <View style={styles.scopeRow}>
                {scopeItems.map((s) => (
                  <Chip key={s} label={RENOVATION_SCOPE_LABELS[s]} selected={false} />
                ))}
              </View>
            </>
          )}
        </Card>

        {/* ─── C. Progress ─── */}
        {hasDbStages && (
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Прогресс ремонта</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <ProgressBar progress={progress / 100} height={6} />
            <Text style={styles.progressDetail}>
              {completedCount} из {totalStages} этапов завершено
            </Text>
          </Card>
        )}

        {/* ─── D. Supervisor ─── */}
        {project?.supervisor_id && (
          <Card style={styles.supervisorCard}>
            <View style={styles.supervisorRow}>
              <View style={styles.supervisorAvatar}>
                <Ionicons name="person" size={20} color={colors.white} />
              </View>
              <View style={styles.supervisorInfo}>
                <Text style={styles.supervisorLabel}>Ваш супервайзер</Text>
                <Text style={styles.supervisorName}>{supervisorName}</Text>
                <LabelMaster level="expert" rating={4.9} reviewCount={87} />
              </View>
              <Button
                title="Чат"
                onPress={() => navigation.navigate('Chat', { projectId })}
                variant="outline"
                size="sm"
                icon={<Ionicons name="chatbubble-outline" size={16} color={colors.primary} />}
              />
            </View>
          </Card>
        )}

        {/* ─── E. Stages ─── */}
        <View style={styles.stagesSection}>
          <View style={styles.stagesHeader}>
            <Text style={styles.sectionTitle}>Этапы ремонта</Text>
            <View style={styles.stagesCountBadge}>
              <Text style={styles.stagesCountText}>
                {hasDbStages ? totalStages : stageBreakdown.length} этапов
              </Text>
            </View>
          </View>

          {hasDbStages ? (
            // Real stages from database
            stages.map((stage) => {
              const breakdown = stageBreakdown.find(
                (b) => b.orderIndex === stage.order_index,
              );
              return (
                <StageAccordion
                  key={stage.id}
                  index={stage.order_index}
                  title={stage.title}
                  description={breakdown?.description || stage.description}
                  checklist={breakdown?.checklist}
                  costMin={breakdown?.costMin}
                  costMax={breakdown?.costMax}
                  days={breakdown?.days}
                  status={stage.status}
                  deadline={stage.deadline}
                  defaultOpen={stage.status === 'in_progress'}
                  onApprove={
                    stage.status === 'done_by_master'
                      ? () =>
                          navigation.navigate('StageApproval', {
                            stageId: stage.id,
                            stageTitle: stage.title,
                            stageIndex: stage.order_index,
                            projectId,
                            projectTitle: project?.title,
                          })
                      : undefined
                  }
                />
              );
            })
          ) : (
            // Preview stages from breakdown (no DB stages yet)
            stageBreakdown.map((item) => (
              <StageAccordion
                key={item.orderIndex}
                index={item.orderIndex}
                title={item.title}
                description={item.description}
                checklist={item.checklist}
                costMin={item.costMin}
                costMax={item.costMax}
                days={item.days}
                status="pending"
              />
            ))
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimerRow}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textLight}
            />
            <Text style={styles.disclaimerText}>
              Примерный план и стоимость. Точную смету составит супервайзер после осмотра объекта
            </Text>
          </View>
        </View>

        {/* ─── F. CTA ─── */}
        <View style={styles.ctaSection}>
          {allStagesApproved || project?.status === 'completed' ? (
            <Button
              title="Оставить отзыв"
              onPress={() =>
                navigation.navigate('Review', {
                  projectId,
                  supervisorId: project?.supervisor_id,
                  supervisorName,
                  masters: mastersFromStages,
                })
              }
              fullWidth
              icon={<Ionicons name="star-outline" size={18} color={colors.white} />}
            />
          ) : project?.status === 'in_progress' ? (
            <Button
              title="Открыть чат"
              onPress={() => navigation.navigate('Chat', { projectId })}
              fullWidth
              icon={<Ionicons name="chatbubble-outline" size={18} color={colors.white} />}
            />
          ) : project?.status === 'new' ? (
            <View style={styles.waitingCard}>
              <Ionicons name="hourglass-outline" size={24} color={colors.accent} />
              <Text style={styles.waitingText}>
                Супервайзер будет назначен в течение 24 часов
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },

  // ─── Hero ───
  heroContainer: {
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.lg,
  },
  heroBg: {
    height: 200,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDecor2: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroContent: {
    gap: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  heroTitle: {
    ...typography.h2,
    color: colors.white,
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroAddress: {
    ...typography.small,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  heroStatus: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
  },

  // ─── Info card ───
  infoCard: {
    marginBottom: spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetLabel: {
    ...typography.body,
    color: colors.textLight,
  },
  budgetValue: {
    ...typography.h3,
    color: colors.primary,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...typography.body,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  scopeTitle: {
    ...typography.smallBold,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  // ─── Progress ───
  progressCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  progressPercent: {
    ...typography.h3,
    color: colors.primary,
  },
  progressDetail: {
    ...typography.small,
    color: colors.textLight,
    marginTop: spacing.xs,
  },

  // ─── Supervisor ───
  supervisorCard: {
    marginBottom: spacing.lg,
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
  supervisorLabel: {
    ...typography.caption,
    color: colors.textLight,
    marginBottom: 2,
  },
  supervisorName: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },

  // ─── Stages ───
  stagesSection: {
    marginBottom: spacing.lg,
  },
  stagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
  },
  stagesCountBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stagesCountText: {
    ...typography.smallBold,
    color: colors.primary,
  },

  // Disclaimer
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 165, 90, 0.08)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  disclaimerText: {
    ...typography.small,
    color: colors.textLight,
    flex: 1,
  },

  // ─── CTA ───
  ctaSection: {
    marginBottom: spacing.xxl,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 165, 90, 0.08)',
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  waitingText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
});
