import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScreenWrapper,
  Card,
  Button,
  AppDialog,
} from '../../components';
import type { DialogButton } from '../../components';
import { spacing, typography, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { RepairType } from '../../types';
import { getStageBreakdown, StageBreakdownItem } from '../../data/stageBreakdown';
import { STAGE_DEPENDENCIES } from '../../data/stageDependencies';
import { hapticSuccess } from '../../utils/haptics';
import { saveProjectStagePlan } from '../../services/projectService';

import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StagePlanItem extends StageBreakdownItem {
  startDate: Date;
  endDate: Date;
  isParallel: boolean;
  parallelWith: number[]; // order indices of parallel stages
  enabled: boolean;
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Date picker for cross-platform ────────────────────────────────────────────

function DatePickerRow({
  label,
  date,
  onDateChange,
  colors,
  dateStyles,
}: {
  label: string;
  date: Date;
  onDateChange: (date: Date) => void;
  colors: ThemeColors;
  dateStyles: ReturnType<typeof useDatePickerStyles>;
}) {
  const [showPicker, setShowPicker] = useState(false);

  // On web, use native date input. On native, use simple +/- day buttons
  if (Platform.OS === 'web') {
    return (
      <View style={dateStyles.row}>
        <Text style={dateStyles.label}>{label}</Text>
        <input
          type="date"
          value={toISODate(date)}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              const [y, m, d] = val.split('-').map(Number);
              onDateChange(new Date(y, m - 1, d));
            }
          }}
          style={{
            fontSize: 15,
            padding: '8px 12px',
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.bgInput,
            color: colors.heading,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </View>
    );
  }

  return (
    <View style={dateStyles.row}>
      <Text style={dateStyles.label}>{label}</Text>
      <View style={dateStyles.stepperRow}>
        <Pressable
          style={dateStyles.stepperBtn}
          onPress={() => onDateChange(addDays(date, -1))}
        >
          <Ionicons name="remove-circle-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          style={dateStyles.dateValue}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={dateStyles.dateText}>{formatDateFull(date)}</Text>
        </Pressable>
        <Pressable
          style={dateStyles.stepperBtn}
          onPress={() => onDateChange(addDays(date, 1))}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function useDatePickerStyles(colors: ThemeColors, glass: GlassTokens, isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    row: {
      gap: spacing.xs,
    },
    label: {
      ...typography.smallBold,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    stepperBtn: {
      padding: spacing.xs,
    },
    dateValue: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: glass.fill.light,
      borderRadius: radius.lg,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: glass.border.light,
    },
    dateText: {
      ...typography.body,
      color: colors.heading,
    },
  }), [colors, glass, isDark]);
}

// ─── Calculate stage plan with dependencies ─────────────────────────────────────

function calculateStagePlan(
  stages: StageBreakdownItem[],
  projectStartDate: Date,
): StagePlanItem[] {
  const stageMap = new Map<number, StageBreakdownItem>();
  stages.forEach((s) => stageMap.set(s.orderIndex, s));

  const result: StagePlanItem[] = [];
  const endDates = new Map<number, Date>();

  const STAGE_TITLES_ORIGINAL: Record<string, number> = {
    'Демонтаж': 1,
    'Электрика (черновая)': 2,
    'Сантехника (черновая)': 3,
    'Стяжка пола': 4,
    'Штукатурка стен': 5,
    'Укладка плитки': 6,
    'Электрика (чистовая)': 7,
    'Сантехника (чистовая)': 8,
    'Шпаклёвка и покраска': 9,
    'Напольное покрытие': 10,
    'Установка дверей': 11,
    'Монтаж потолков': 12,
    'Чистовая отделка': 13,
    'Финальная уборка': 14,
  };

  const stagesWithOrigIdx = stages.map((s) => ({
    ...s,
    origIndex: STAGE_TITLES_ORIGINAL[s.title] ?? s.orderIndex,
  }));

  const presentIndices = new Set(stagesWithOrigIdx.map((s) => s.origIndex));

  for (const stage of stagesWithOrigIdx) {
    const dep = STAGE_DEPENDENCIES[stage.origIndex];
    let startDate = new Date(projectStartDate);

    if (dep && dep.must_after.length > 0) {
      const relevantDeps = dep.must_after.filter((d) => presentIndices.has(d));
      for (const depIdx of relevantDeps) {
        const depEnd = endDates.get(depIdx);
        if (depEnd && depEnd > startDate) {
          startDate = new Date(depEnd);
        }
      }
    }

    const endDate = addDays(startDate, stage.days);
    endDates.set(stage.origIndex, endDate);

    const parallelWith: number[] = [];
    if (dep) {
      for (const parIdx of dep.can_parallel_with) {
        if (presentIndices.has(parIdx)) {
          parallelWith.push(parIdx);
        }
      }
    }

    result.push({
      ...stage,
      startDate,
      endDate,
      isParallel: parallelWith.length > 0,
      parallelWith,
      enabled: true,
    });
  }

  return result;
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

function formatRublesShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} млн`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)} тыс`;
  }
  return `${amount} ₽`;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function SupervisorStagePlanScreen({ route, navigation }: any) {
  const { colors, glass, isDark } = useTheme();
  const styles = useStagePlanStyles(colors, glass, isDark);
  const dateStyles = useDatePickerStyles(colors, glass, isDark);
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isDev = user?.id?.startsWith('dev-');
  const showToast = useToastStore((s) => s.show);

  const projectId: string = route?.params?.projectId ?? 'sp-1';
  const repairType: RepairType = route?.params?.repairType ?? 'standard';
  const areaSqm: number = route?.params?.areaSqm ?? 54;

  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [saving, setSaving] = useState(false);
  const [disabledStages, setDisabledStages] = useState<Set<number>>(new Set());

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const rawStages = useMemo(
    () => getStageBreakdown(repairType, areaSqm),
    [repairType, areaSqm],
  );

  // Full plan with all stages (for toggle UI)
  const fullStagePlan = useMemo(
    () => calculateStagePlan(rawStages, startDate),
    [rawStages, startDate],
  );

  // Filtered plan — only enabled stages, recalculated dates
  const enabledRawStages = useMemo(
    () => rawStages.filter((s) => !disabledStages.has(s.orderIndex)),
    [rawStages, disabledStages],
  );

  const stagePlan = useMemo(
    () => calculateStagePlan(enabledRawStages, startDate),
    [enabledRawStages, startDate],
  );

  const totalDays = useMemo(() => {
    if (stagePlan.length === 0) return 0;
    const lastEnd = stagePlan.reduce((latest, s) => (s.endDate > latest ? s.endDate : latest), stagePlan[0].endDate);
    const diff = Math.ceil((lastEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [stagePlan, startDate]);

  const estimatedEnd = useMemo(() => {
    if (stagePlan.length === 0) return startDate;
    return stagePlan.reduce((latest, s) => (s.endDate > latest ? s.endDate : latest), stagePlan[0].endDate);
  }, [stagePlan, startDate]);

  const totalCostMin = enabledRawStages.reduce((sum, s) => sum + s.costMin, 0);
  const totalCostMax = enabledRawStages.reduce((sum, s) => sum + s.costMax, 0);

  const toggleStage = useCallback((orderIndex: number) => {
    setDisabledStages((prev) => {
      const next = new Set(prev);
      if (next.has(orderIndex)) {
        next.delete(orderIndex);
      } else {
        next.add(orderIndex);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setDialogTitle('Сохранить план?');
    setDialogMessage(
      `${stagePlan.length} этапов, ${totalDays} дней\nНачало: ${formatDateFull(startDate)}\nОкончание: ${formatDateFull(estimatedEnd)}\n\nВнимание: если работы по этапам уже начались, сохранение перезапишет план.`,
    );
    setDialogButtons([
      {
        text: 'Сохранить',
        onPress: async () => {
          setSaving(true);
          try {
            if (isDev) {
              await new Promise((r) => setTimeout(r, 500));
            } else {
              await saveProjectStagePlan(
                projectId,
                stagePlan.map((s) => ({
                  title: s.title,
                  description: s.description,
                  order_index: s.orderIndex,
                  planned_start_date: toISODate(s.startDate),
                  planned_end_date: toISODate(s.endDate),
                  duration_days: s.days,
                })),
              );
            }

            hapticSuccess();
            showToast('План этапов сохранён', 'success');

            setTimeout(() => {
              navigation.goBack();
            }, 50);
          } catch {
            showToast('Не удалось сохранить план', 'error');
          } finally {
            setSaving(false);
          }
        },
      },
      { text: 'Отмена', style: 'cancel', onPress: () => {} },
    ]);
    setDialogVisible(true);
  }, [stagePlan, totalDays, startDate, estimatedEnd, isDev, projectId, navigation, showToast]);

  const renderStageCard = (stage: StagePlanItem, idx: number, isDisabled: boolean) => {
    const isParallel = stage.isParallel && !isDisabled;

    return (
      <View key={`stage-${stage.orderIndex}`} style={[styles.stageRow, isDisabled && { opacity: 0.45 }]}>
        {/* Timeline connector */}
        <View style={styles.timelineCol}>
          {idx > 0 && <View style={styles.timelineLineTop} />}
          <View style={[
            styles.timelineDot,
            isParallel && styles.timelineDotParallel,
            isDisabled && { backgroundColor: colors.textLight },
          ]}>
            <Text style={styles.timelineDotText}>{isDisabled ? '–' : (() => { const i = stagePlan.findIndex((s) => s.orderIndex === stage.orderIndex); return i >= 0 ? String(i + 1) : ''; })()}</Text>
          </View>
          {idx < fullStagePlan.length - 1 && <View style={styles.timelineLineBottom} />}
        </View>

        {/* Stage card */}
        <View style={[styles.stageCard, isParallel && styles.stageCardParallel]}>
          <View style={styles.stageHeader}>
            <Text style={[styles.stageTitle, isDisabled && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{stage.title}</Text>
            <Pressable
              onPress={() => toggleStage(stage.orderIndex)}
              hitSlop={8}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                borderRadius: radius.full,
                backgroundColor: isDisabled ? colors.successLight || 'rgba(42,157,92,0.1)' : colors.dangerLight || 'rgba(196,64,64,0.1)',
              }}
            >
              <Text style={{
                ...typography.caption,
                color: isDisabled ? colors.success : colors.danger,
                fontWeight: '700',
                fontSize: 11,
              }}>
                {isDisabled ? 'Вернуть' : 'Убрать'}
              </Text>
            </Pressable>
          </View>

          {!isDisabled && (
            <>
              <View style={styles.stageDates}>
                <View style={styles.stageDateItem}>
                  <Ionicons name="play-outline" size={12} color={colors.success} />
                  <Text style={styles.stageDateText}>{formatDateShort(stage.startDate)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={10} color={colors.textLight} />
                <View style={styles.stageDateItem}>
                  <Ionicons name="flag-outline" size={12} color={colors.primary} />
                  <Text style={styles.stageDateText}>{formatDateShort(stage.endDate)}</Text>
                </View>
              </View>

              <View style={styles.stageCost}>
                <Ionicons name="cash-outline" size={12} color={colors.textLight} />
                <Text style={styles.stageCostText}>
                  {formatRublesShort(stage.costMin)} – {formatRublesShort(stage.costMax)}
                </Text>
              </View>

              {isParallel && (
                <View style={styles.parallelBadge}>
                  <Ionicons name="git-branch-outline" size={12} color={colors.accent} />
                  <Text style={styles.parallelText}>Параллельно</Text>
                </View>
              )}

              <Text style={styles.stageDesc} numberOfLines={2}>{stage.description}</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.summaryTitle}>План ремонта</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{stagePlan.length}</Text>
              <Text style={styles.summaryLabel}>
                {disabledStages.size > 0 ? `из ${fullStagePlan.length} этапов` : 'этапов'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalDays}</Text>
              <Text style={styles.summaryLabel}>дней</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { fontSize: 16 }]}>
                {formatRublesShort(totalCostMin)}
              </Text>
              <Text style={styles.summaryLabel}>мин. ₽</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.dateCard}>
          <DatePickerRow
            label="Дата начала работ"
            date={startDate}
            onDateChange={(d) => {
              if (d >= new Date(new Date().setHours(0, 0, 0, 0))) {
                setStartDate(d);
              } else {
                showToast('Нельзя выбрать прошедшую дату', 'warning');
              }
            }}
            colors={colors}
            dateStyles={dateStyles}
          />
          <View style={styles.endDateRow}>
            <Ionicons name="flag" size={14} color={colors.success} />
            <Text style={styles.endDateText}>
              Окончание: {formatDateFull(estimatedEnd)}
            </Text>
          </View>
        </Card>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Этапы работ</Text>
          <Text style={{ ...typography.caption, color: colors.textLight, marginBottom: spacing.xs }}>
            Нажмите «Убрать» чтобы исключить этап из плана
          </Text>
          {fullStagePlan.map((stage, idx) => {
            const isDisabled = disabledStages.has(stage.orderIndex);
            // For enabled stages, use recalculated dates from stagePlan
            const recalculated = !isDisabled
              ? stagePlan.find((s) => s.orderIndex === stage.orderIndex) || stage
              : stage;
            return renderStageCard(recalculated, idx, isDisabled);
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button
          title="Сохранить план"
          onPress={handleSave}
          loading={saving}
          fullWidth
          icon={<Ionicons name="checkmark-circle" size={18} color={colors.white} />}
        />
      </View>
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

// ─── Styles ─────────────────────────────────────────────────────────────────────

function useStagePlanStyles(colors: ThemeColors, glass: GlassTokens, isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    scrollContent: {
      paddingBottom: 100,
      gap: spacing.lg,
    },

    summaryCard: {
      gap: spacing.md,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    summaryTitle: {
      ...typography.h3,
      color: colors.heading,
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
      gap: 2,
    },
    summaryNum: {
      ...typography.h2,
      color: colors.primary,
      fontWeight: '700',
    },
    summaryLabel: {
      ...typography.caption,
      color: colors.textLight,
    },

    dateCard: {
      gap: spacing.md,
    },
    endDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    endDateText: {
      ...typography.body,
      color: colors.heading,
      fontWeight: '600',
    },

    timelineSection: {
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.heading,
      marginBottom: spacing.xs,
    },

    stageRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    timelineCol: {
      width: 36,
      alignItems: 'center',
    },
    timelineLineTop: {
      width: 2,
      flex: 1,
      backgroundColor: isDark ? 'rgba(232,87,122,0.15)' : 'rgba(123,45,62,0.15)',
      marginBottom: -1,
    },
    timelineDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    timelineDotParallel: {
      backgroundColor: colors.accent,
    },
    timelineDotText: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '700',
      fontSize: 11,
    },
    timelineLineBottom: {
      width: 2,
      flex: 1,
      backgroundColor: isDark ? 'rgba(232,87,122,0.15)' : 'rgba(123,45,62,0.15)',
      marginTop: -1,
    },

    stageCard: {
      flex: 1,
      backgroundColor: glass.fill.light,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: glass.border.light,
      padding: spacing.md,
      gap: spacing.xs + 2,
      shadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(123,45,62,0.05)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 1,
      marginBottom: spacing.xs,
    },
    stageCardParallel: {
      borderColor: isDark ? 'rgba(240,201,93,0.25)' : 'rgba(197,165,90,0.3)',
      backgroundColor: isDark ? 'rgba(240,201,93,0.05)' : 'rgba(197,165,90,0.05)',
    },
    stageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    stageTitle: {
      ...typography.bodyBold,
      color: colors.heading,
      flex: 1,
    },
    daysBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    daysBadgeText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700',
    },
    stageDates: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    stageDateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    stageDateText: {
      ...typography.small,
      color: colors.text,
    },
    stageCost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    stageCostText: {
      ...typography.caption,
      color: colors.textLight,
    },
    parallelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    parallelText: {
      ...typography.caption,
      color: colors.accent,
      fontWeight: '600',
    },
    stageDesc: {
      ...typography.small,
      color: colors.textLight,
      lineHeight: 18,
    },

    bottomBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: glass.border.light,
    },
  }), [colors, glass, isDark]);
}
