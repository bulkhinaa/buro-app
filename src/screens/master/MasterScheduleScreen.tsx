import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, ProgressBar, GlassView } from '../../components';
import { WeekGrid } from '../../components/WeekGrid';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import {
  useScheduleStore,
  getWeekStart,
  formatDate,
  getWeekDates,
  DAY_LABELS_SHORT,
} from '../../store/scheduleStore';
import type { ScheduleSlotStatus } from '../../types';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function MasterScheduleScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    slots,
    isLoading,
    init,
    fetchWeek,
    toggleSlot,
    batchToggleSlots,
    getOccupancy,
  } = useScheduleStore();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [showMonthView, setShowMonthView] = useState(false);

  const masterId = user?.id || '';

  useEffect(() => {
    if (masterId) {
      init(masterId);
    }
  }, [masterId]);

  useEffect(() => {
    if (masterId) {
      fetchWeek(masterId, currentWeekStart);
    }
  }, [masterId, currentWeekStart]);

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const handleToggleSlot = useCallback(
    (date: string, hour: number) => {
      toggleSlot(masterId, date, hour);
    },
    [masterId, toggleSlot]
  );

  const handleDragSelect = useCallback(
    (selectedSlots: { date: string; hour: number }[], status: ScheduleSlotStatus) => {
      batchToggleSlots(masterId, selectedSlots, status);
    },
    [masterId, batchToggleSlots]
  );

  const occupancy = useMemo(
    () => getOccupancy(currentWeekStart),
    [getOccupancy, currentWeekStart, slots]
  );

  // Week label
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = MONTH_NAMES[start.getMonth()];
    const endMonth = MONTH_NAMES[end.getMonth()];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} — ${end.getDate()} ${startMonth}`;
    }
    return `${start.getDate()} ${startMonth} — ${end.getDate()} ${endMonth}`;
  }, [weekDates]);

  // Month overview: 5 weeks of dots
  const monthWeeks = useMemo(() => {
    const weeks: Date[] = [];
    const start = getWeekStart(new Date(currentWeekStart));
    start.setDate(start.getDate() - 14); // 2 weeks before
    for (let i = 0; i < 5; i++) {
      const w = new Date(start);
      w.setDate(w.getDate() + i * 7);
      weeks.push(w);
    }
    return weeks;
  }, [currentWeekStart]);

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Мой график</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('MasterScheduleTemplate')}
            >
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('MasterVacations')}
            >
              <Ionicons name="airplane-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={handlePrevWeek} style={styles.navArrow}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthView(!showMonthView)}>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextWeek} style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Today button */}
        {formatDate(currentWeekStart) !== formatDate(getWeekStart(new Date())) && (
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => setCurrentWeekStart(getWeekStart(new Date()))}
          >
            <Text style={styles.todayBtnText}>Сегодня</Text>
          </TouchableOpacity>
        )}

        {/* Month overview (toggle) */}
        {showMonthView && (
          <GlassView style={styles.monthOverview}>
            <View style={styles.monthRow}>
              {monthWeeks.map((weekDate, i) => {
                const isActive =
                  formatDate(weekDate) === formatDate(currentWeekStart);
                const dates = getWeekDates(weekDate);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.monthWeek, isActive && styles.monthWeekActive]}
                    onPress={() => {
                      setCurrentWeekStart(weekDate);
                      setShowMonthView(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthWeekText,
                        isActive && styles.monthWeekTextActive,
                      ]}
                    >
                      {dates[0].getDate()}-{dates[6].getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassView>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(123,45,62,0.08)' }]} />
            <Text style={styles.legendText}>Свободен</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Рабочий</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#C7C7CC' }]} />
            <Text style={styles.legendText}>Занят</Text>
          </View>
        </View>

        {/* Week Grid */}
        <WeekGrid
          weekStart={currentWeekStart}
          slots={slots}
          masterId={masterId}
          onToggleSlot={handleToggleSlot}
          onDragSelect={handleDragSelect}
        />

        {/* Occupancy footer */}
        <GlassView style={styles.occupancyCard}>
          <View style={styles.occupancyRow}>
            <Text style={styles.occupancyLabel}>Занятость</Text>
            <Text style={styles.occupancyValue}>{occupancy.percent}%</Text>
          </View>
          <ProgressBar
            progress={occupancy.percent / 100}
            color={occupancy.percent > 80 ? colors.danger : colors.primary}
            height={8}
          />
          <Text style={styles.occupancyDetail}>
            {occupancy.working} из {occupancy.total} слотов
          </Text>
        </GlassView>

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.heading,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.heading,
  },
  todayBtn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  monthOverview: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthWeek: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  monthWeekActive: {
    backgroundColor: colors.primary,
  },
  monthWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  monthWeekTextActive: {
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
  },
  occupancyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  occupancyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.heading,
  },
  occupancyValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  occupancyDetail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});
