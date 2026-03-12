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
import {
  ScreenWrapper,
  Card,
  Button,
  AppDialog,
} from '../../components';
import type { DialogButton } from '../../components';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { RepairType, Stage } from '../../types';
import { getStageBreakdown, StageBreakdownItem } from '../../data/stageBreakdown';
import { STAGE_DEPENDENCIES } from '../../data/stageDependencies';
import { hapticSuccess } from '../../utils/haptics';

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
}: {
  label: string;
  date: Date;
  onDateChange: (date: Date) => void;
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
            border: '1px solid rgba(255,255,255,0.8)',
            backgroundColor: 'rgba(255,255,255,0.65)',
            color: '#1a1a2e',
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

const dateStyles = StyleSheet.create({
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
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  dateText: {
    ...typography.body,
    color: colors.heading,
  },
});

// ─── Calculate stage plan with dependencies ─────────────────────────────────────

function calculateStagePlan(
  stages: StageBreakdownItem[],
  projectStartDate: Date,
): StagePlanItem[] {
  // Map orderIndex to stage for quick lookup
  const stageMap = new Map<number, StageBreakdownItem>();
  stages.forEach((s) => stageMap.set(s.orderIndex, s));

  // Calculate dates respecting dependencies
  const result: StagePlanItem[] = [];
  const endDates = new Map<number, Date>(); // orderIndex → end date

  // We need to map between original (1-14) order indices and filtered indices
  // The dependencies use original order indices from stageDependencies.ts
  // But getStageBreakdown re-indexes them 1..N for filtered set
  // We need to find the original order index for each stage by title matching

  // Build title → original index mapping from STAGE_DEPENDENCIES keys
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

  // Map each stage to its original index
  const stagesWithOrigIdx = stages.map((s) => ({
    ...s,
    origIndex: STAGE_TITLES_ORIGINAL[s.title] ?? s.orderIndex,
  }));

  // Set of original indices present in filtered list
  const presentIndices = new Set(stagesWithOrigIdx.map((s) => s.origIndex));

  // Calculate start/end dates in order
  for (const stage of stagesWithOrigIdx) {
    const dep = STAGE_DEPENDENCIES[stage.origIndex];
    let startDate = new Date(projectStartDate);

    if (dep && dep.must_after.length > 0) {
      // Find the latest end date among all dependencies that are in our filtered set
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

    // Determine parallel stages
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

// ─── Component ──────────────────────────────────────────────────────────────────

export function SupervisorStagePlanScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const isDev = user?.id?.startsWith('dev-');
  const showToast = useToastStore((s) => s.show);

  const projectId: string = route?.params?.projectId ?? 'sp-1';
  const repairType: RepairType = route?.params?.repairType ?? 'standard';
  const areaSqm: number = route?.params?.areaSqm ?? 54;

  // Project start date — default tomorrow
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [saving, setSaving] = useState(false);

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  // Get stages from template
  const rawStages = useMemo(
    () => getStageBreakdown(repairType, areaSqm),
    [repairType, areaSqm],
  );

  // Calculate plan with dates
  const stagePlan = useMemo(
    () => calculateStagePlan(rawStages, startDate),
    [rawStages, startDate],
  );

  // Total days
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

  // Total cost range
  const totalCostMin = rawStages.reduce((sum, s) => sum + s.costMin, 0);
  const totalCostMax = rawStages.reduce((sum, s) => sum + s.costMax, 0);

  // ─── Save plan ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setDialogTitle('Сохранить план?');
    setDialogMessage(
      `${stagePlan.length} этапов, ${totalDays} дней\nНачало: ${formatDateFull(startDate)}\nОкончание: ${formatDateFull(estimatedEnd)}`,
    );
    setDialogButtons([
      {
        text: 'Сохранить',
        onPress: async () => {
          setSaving(true);
          try {
            if (!isDev) {
              // In production, create stages in Supabase
              // For now, this is a placeholder for the service call
              // await createProjectStages(projectId, stagePlan.map(...))
            }

            // Simulate save for dev
            await new Promise((r) => setTimeout(r, 500));

            hapticSuccess();
            showToast('План этапов сохранён', 'success');

            // Navigate back
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

  // ─── Render stage card ──────────────────────────────────────────────────────

  const renderStageCard = (stage: StagePlanItem, idx: number) => {
    // Color based on position in timeline
    const progressPercent = idx / stagePlan.length;
    const isParallel = stage.isParallel;

    return (
      <View key={`stage-${idx}`} style={styles.stageRow}>
        {/* Timeline connector */}
        <View style={styles.timelineCol}>
          {/* Top line */}
          {idx > 0 && <View style={styles.timelineLineTop} />}
          {/* Dot */}
          <View style={[
            styles.timelineDot,
            isParallel && styles.timelineDotParallel,
          ]}>
            <Text style={styles.timelineDotText}>{idx + 1}</Text>
          </View>
          {/* Bottom line */}
          {idx < stagePlan.length - 1 && <View style={styles.timelineLineBottom} />}
        </View>

        {/* Stage card */}
        <View style={[styles.stageCard, isParallel && styles.stageCardParallel]}>
          {/* Header: title + days */}
          <View style={styles.stageHeader}>
            <Text style={styles.stageTitle} numberOfLines={1}>{stage.title}</Text>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>{stage.days} дн.</Text>
            </View>
          </View>

          {/* Dates */}
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

          {/* Cost */}
          <View style={styles.stageCost}>
            <Ionicons name="cash-outline" size={12} color={colors.textLight} />
            <Text style={styles.stageCostText}>
              {formatRublesShort(stage.costMin)} – {formatRublesShort(stage.costMax)}
            </Text>
          </View>

          {/* Parallel indicator */}
          {isParallel && (
            <View style={styles.parallelBadge}>
              <Ionicons name="git-branch-outline" size={12} color={colors.accent} />
              <Text style={styles.parallelText}>Параллельно</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.stageDesc} numberOfLines={2}>{stage.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.summaryTitle}>План ремонта</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{stagePlan.length}</Text>
              <Text style={styles.summaryLabel}>этапов</Text>
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

        {/* Start date picker */}
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
          />
          <View style={styles.endDateRow}>
            <Ionicons name="flag" size={14} color={colors.success} />
            <Text style={styles.endDateText}>
              Окончание: {formatDateFull(estimatedEnd)}
            </Text>
          </View>
        </Card>

        {/* Stages timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Этапы работ</Text>
          {stagePlan.map((stage, idx) => renderStageCard(stage, idx))}
        </View>
      </ScrollView>

      {/* Bottom bar: save button */}
      <View style={styles.bottomBar}>
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

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
    gap: spacing.lg,
  },

  // Summary
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

  // Date picker card
  dateCard: {
    gap: spacing.md,
  },
  endDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  endDateText: {
    ...typography.body,
    color: colors.heading,
    fontWeight: '600',
  },

  // Timeline section
  timelineSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.xs,
  },

  // Stage row with timeline
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
    backgroundColor: 'rgba(123,45,62,0.15)',
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
    backgroundColor: 'rgba(123,45,62,0.15)',
    marginTop: -1,
  },

  // Stage card
  stageCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing.md,
    gap: spacing.xs + 2,
    shadowColor: 'rgba(123,45,62,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: spacing.xs,
  },
  stageCardParallel: {
    borderColor: 'rgba(197,165,90,0.3)',
    backgroundColor: 'rgba(197,165,90,0.05)',
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
    backgroundColor: 'rgba(123,45,62,0.1)',
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
    backgroundColor: 'rgba(197,165,90,0.12)',
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

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    backgroundColor: 'rgba(243,237,232,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.8)',
  },
});
