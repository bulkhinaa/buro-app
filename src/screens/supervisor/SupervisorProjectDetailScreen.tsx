import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  StatusBadge,
  Button,
  MapPreview,
  ProgressBar,
  AppDialog,
} from '../../components';
import type { DialogButton } from '../../components';
import { spacing, typography, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { Project, Stage, REPAIR_TYPE_LABELS, STAGE_STATUS_LABELS } from '../../types';
import {
  fetchProject,
  fetchProjectStages,
  supervisorAcceptProject,
} from '../../services/projectService';
import { formatRubles } from '../../utils/calculator';
import { hapticSuccess } from '../../utils/haptics';

import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';


// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'object' | 'stages';

// ─── Component ────────────────────────────────────────────────────────────────

export function SupervisorProjectDetailScreen({ route, navigation }: any) {
  const { colors, glass, isDark } = useTheme();
  const styles = useSupervisorProjectDetailStyles(colors, glass, isDark);
  const { user } = useAuthStore();

  const projectId: string = route?.params?.projectId;
  const initialStatus: string = route?.params?.projectStatus ?? 'in_progress';

  const [activeTab, setActiveTab] = useState<Tab>('object');
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
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

  // ─── Status colors ──────────────────────────────────────────────────────
  const getStageStatusColor = useCallback((status: Stage['status']): string => {
    switch (status) {
      case 'approved': return colors.success;
      case 'in_progress': return colors.primary;
      case 'done_by_master': return colors.accent;
      case 'rejected': return colors.danger;
      default: return colors.textLight;
    }
  }, [colors]);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [proj, stgs] = await Promise.all([
        fetchProject(projectId),
        fetchProjectStages(projectId),
      ]);
      setProject(proj);
      setStages(stgs);
    } catch {
      // silently fall back
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats
  const doneCount = stages.filter((s) => s.status === 'approved').length;
  const pendingReview = stages.filter((s) => s.status === 'done_by_master').length;
  const progress = stages.length > 0 ? doneCount / stages.length : 0;

  // ─── Accept project (planning → in_progress) ────────────────────────────
  const handleAccept = () => {
    showDialog(
      'Принять проект?',
      'Вы берёте этот проект в работу. Начните с планирования этапов.',
      [
        {
          text: 'Принять',
          onPress: async () => {
            try {
              await supervisorAcceptProject(projectId);
              setProject((prev) => prev ? { ...prev, status: 'in_progress' } : prev);
              hapticSuccess();
            } catch {
              // fallback for dev
            }
          },
        },
        { text: 'Отмена', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  // ─── Render object tab ───────────────────────────────────────────────────

  const renderObjectTab = () => {
    if (!project) return null;
    return (
      <View style={styles.tabContent}>
        {/* Status + progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <StatusBadge status={project.status} type="project" />
            {pendingReview > 0 && (
              <View style={styles.reviewBadge}>
                <Ionicons name="hourglass-outline" size={12} color={colors.accent} />
                <Text style={styles.reviewBadgeText}>{pendingReview} на проверке</Text>
              </View>
            )}
          </View>
          <View style={styles.progressRow}>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={progress} />
            </View>
            <Text style={styles.progressText}>{doneCount}/{stages.length} этапов</Text>
          </View>
        </Card>

        {/* Object info */}
        <Card>
          <Text style={styles.cardSectionTitle}>Объект</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{project.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="resize-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{project.area_sqm} м²</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="construct-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{REPAIR_TYPE_LABELS[project.repair_type]}</Text>
          </View>
          {project.budget_min != null && project.budget_max != null && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                {formatRubles(project.budget_min)} – {formatRubles(project.budget_max)}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Создан: {new Date(project.created_at).toLocaleDateString('ru-RU')}
            </Text>
          </View>
        </Card>

        {/* Map */}
        <MapPreview address={project.address} />

        {/* Chat button */}
        <Button
          title="Открыть чат проекта"
          onPress={() => navigation.navigate('Chat', { projectId: project.id })}
          variant="outline"
          icon={<Ionicons name="chatbubble-outline" size={18} color={colors.primary} />}
        />

        {/* Accept if planning */}
        {project.status === 'planning' && (
          <Button
            title="Принять проект в работу"
            onPress={handleAccept}
            style={{ marginTop: spacing.sm }}
          />
        )}
      </View>
    );
  };

  // ─── Render stages tab ───────────────────────────────────────────────────

  const renderStageItem = (stage: Stage, idx: number) => {
    const isDone = stage.status === 'approved';
    const isReview = stage.status === 'done_by_master';
    const statusColor = getStageStatusColor(stage.status);
    const statusIcon = (() => {
      switch (stage.status) {
        case 'approved': return 'checkmark-circle';
        case 'in_progress': return 'play-circle';
        case 'done_by_master': return 'hourglass';
        case 'rejected': return 'close-circle';
        default: return 'ellipse-outline';
      }
    })();

    return (
      <Pressable
        key={stage.id}
        onPress={() =>
          navigation.navigate('SupervisorStageDetail', {
            stageId: stage.id,
            projectId: projectId,
            stageTitle: stage.title,
          })
        }
        style={({ pressed }) => [
          styles.stageCard,
          isDone && styles.stageCardDone,
          isReview && styles.stageCardReview,
          pressed && { opacity: 0.85 },
        ]}
      >
        {/* Number circle */}
        <View style={[styles.stageNumber, { backgroundColor: isDone ? colors.success : isReview ? colors.accent : colors.primaryLight }]}>
          {isDone ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : (
            <Text style={[styles.stageNumberText, { color: isReview ? colors.white : colors.primary }]}>
              {idx + 1}
            </Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.stageInfo}>
          <Text style={[styles.stageTitle, isDone && styles.stageTitleDone]} numberOfLines={1}>
            {stage.title}
          </Text>
          <View style={styles.stageMeta}>
            <Ionicons name={statusIcon as any} size={12} color={statusColor} />
            <Text style={[styles.stageStatus, { color: statusColor }]}>
              {STAGE_STATUS_LABELS[stage.status]}
            </Text>
            {stage.deadline && (
              <>
                <Text style={styles.stageDot}>·</Text>
                <Text style={styles.stageDeadline}>
                  до {new Date(stage.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Review indicator */}
        {isReview && (
          <View style={styles.reviewIndicator}>
            <Text style={styles.reviewIndicatorText}>Проверить</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </View>
        )}

        {!isReview && (
          <Ionicons name="chevron-forward" size={16} color={colors.border} />
        )}
      </Pressable>
    );
  };

  const renderStagesTab = () => (
    <View style={styles.tabContent}>
      {/* Summary */}
      <View style={styles.stageSummaryRow}>
        <View style={styles.stageSummaryItem}>
          <Text style={[styles.stageSummaryNum, { color: colors.success }]}>{doneCount}</Text>
          <Text style={styles.stageSummaryLabel}>Выполнено</Text>
        </View>
        <View style={styles.stageSummaryItem}>
          <Text style={[styles.stageSummaryNum, { color: colors.primary }]}>
            {stages.filter((s) => s.status === 'in_progress').length}
          </Text>
          <Text style={styles.stageSummaryLabel}>В работе</Text>
        </View>
        <View style={styles.stageSummaryItem}>
          <Text style={[styles.stageSummaryNum, { color: colors.accent }]}>{pendingReview}</Text>
          <Text style={styles.stageSummaryLabel}>На проверке</Text>
        </View>
        <View style={styles.stageSummaryItem}>
          <Text style={[styles.stageSummaryNum, { color: colors.textLight }]}>
            {stages.filter((s) => s.status === 'pending').length}
          </Text>
          <Text style={styles.stageSummaryLabel}>Ожидает</Text>
        </View>
      </View>

      {/* Create plan button */}
      <Button
        title="Создать план этапов"
        onPress={() =>
          navigation.navigate('SupervisorStagePlan', {
            projectId,
            repairType: project?.repair_type ?? 'standard',
            areaSqm: project?.area_sqm ?? 54,
          })
        }
        variant="outline"
        icon={<Ionicons name="create-outline" size={18} color={colors.primary} />}
      />

      {/* Stages list */}
      {stages.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="list-outline" size={40} color={colors.primary} />
          <Text style={styles.emptyText}>Этапы ещё не созданы</Text>
          <Text style={styles.emptySubtext}>Используйте кнопку ниже, чтобы создать план</Text>
        </Card>
      ) : (
        stages.map((stage, idx) => renderStageItem(stage, idx))
      )}
    </View>
  );

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!project) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Проект не найден</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      {/* Header info */}
      <View style={styles.header}>
        <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={13} color={colors.textLight} />
          <Text style={styles.projectAddress} numberOfLines={1}>
            {project.address}
          </Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeTab === 'object' && styles.tabItemActive]}
          onPress={() => setActiveTab('object')}
        >
          <Ionicons
            name={activeTab === 'object' ? 'home' : 'home-outline'}
            size={16}
            color={activeTab === 'object' ? colors.primary : colors.textLight}
          />
          <Text style={[styles.tabLabel, activeTab === 'object' && styles.tabLabelActive]}>
            Объект
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === 'stages' && styles.tabItemActive]}
          onPress={() => setActiveTab('stages')}
        >
          <Ionicons
            name={activeTab === 'stages' ? 'list' : 'list-outline'}
            size={16}
            color={activeTab === 'stages' ? colors.primary : colors.textLight}
          />
          <Text style={[styles.tabLabel, activeTab === 'stages' && styles.tabLabelActive]}>
            Этапы
          </Text>
          {pendingReview > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingReview}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Tab content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'object' ? renderObjectTab() : renderStagesTab()}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

function useSupervisorProjectDetailStyles(colors: ThemeColors, glass: GlassTokens, isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    header: {
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: spacing.md,
    },
    projectTitle: {
      ...typography.h2,
      color: colors.heading,
      marginBottom: spacing.xs,
    },
    projectAddress: {
      ...typography.small,
      color: colors.textLight,
    },

    // Tabs
    tabBar: {
      flexDirection: 'row',
      backgroundColor: glass.fill.light,
      borderRadius: radius.xl,
      padding: 4,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: glass.border.light,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      gap: spacing.xs,
    },
    tabItemActive: {
      backgroundColor: isDark ? colors.bgElevated : colors.white,
      shadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(123,45,62,0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    tabLabel: {
      ...typography.smallBold,
      color: colors.textLight,
    },
    tabLabelActive: {
      color: colors.primary,
    },
    tabBadge: {
      backgroundColor: colors.accent,
      borderRadius: radius.full,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    tabBadgeText: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '700',
    },

    // Scroll
    scrollContent: {
      paddingBottom: 24,
    },
    tabContent: {
      gap: spacing.md,
    },

    // Progress card
    progressCard: {
      gap: spacing.sm,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reviewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
    },
    reviewBadgeText: {
      ...typography.caption,
      color: colors.accent,
      fontWeight: '600',
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    progressText: {
      ...typography.smallBold,
      color: colors.primary,
      minWidth: 60,
      textAlign: 'right',
    },

    // Object info
    cardSectionTitle: {
      ...typography.smallBold,
      color: colors.textLight,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    infoText: {
      ...typography.body,
      color: colors.heading,
      flex: 1,
    },

    // Stage list
    stageSummaryRow: {
      flexDirection: 'row',
      backgroundColor: glass.fill.light,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: glass.border.light,
    },
    stageSummaryItem: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    stageSummaryNum: {
      ...typography.h2,
      fontWeight: '700',
    },
    stageSummaryLabel: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
    },

    stageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: glass.fill.light,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: glass.border.light,
      gap: spacing.md,
      shadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(123,45,62,0.05)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 1,
    },
    stageCardDone: {
      opacity: 0.65,
      backgroundColor: isDark ? 'rgba(62,220,132,0.06)' : 'rgba(52,199,89,0.04)',
    },
    stageCardReview: {
      borderColor: isDark ? 'rgba(240,201,93,0.25)' : 'rgba(197,165,90,0.3)',
      backgroundColor: isDark ? 'rgba(240,201,93,0.06)' : 'rgba(197,165,90,0.06)',
    },
    stageNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stageNumberText: {
      ...typography.smallBold,
      fontSize: 13,
    },
    stageInfo: {
      flex: 1,
      gap: 3,
    },
    stageTitle: {
      ...typography.bodyBold,
      color: colors.heading,
    },
    stageTitleDone: {
      color: colors.textLight,
      textDecorationLine: 'line-through',
    },
    stageMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    stageStatus: {
      ...typography.caption,
      fontWeight: '600',
    },
    stageDot: {
      ...typography.caption,
      color: colors.textLight,
    },
    stageDeadline: {
      ...typography.caption,
      color: colors.textLight,
    },
    reviewIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    reviewIndicatorText: {
      ...typography.caption,
      color: colors.accent,
      fontWeight: '700',
    },

    // Empty
    emptyCard: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.sm,
    },
    emptyText: {
      ...typography.bodyBold,
      color: colors.heading,
    },
    emptySubtext: {
      ...typography.small,
      color: colors.textLight,
      textAlign: 'center',
    },

    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.huge,
    },
  }), [colors, glass, isDark]);
}
