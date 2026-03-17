import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface DateRangePickerProps {
  dateFrom: string; // YYYY-MM-DD or ''
  dateTo: string;   // YYYY-MM-DD or ''
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  /** Minimum selectable date (default: today) */
  minDate?: string;
}

function formatISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  minDate,
}: DateRangePickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    return formatISO(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const min = minDate || today;

  // Current displayed month
  const [viewYear, setViewYear] = useState(() => {
    if (dateFrom) {
      const d = new Date(dateFrom + 'T00:00:00');
      return d.getFullYear();
    }
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (dateFrom) {
      const d = new Date(dateFrom + 'T00:00:00');
      return d.getMonth();
    }
    return new Date().getMonth();
  });

  // Selection state: which endpoint to set next
  const [selectingEnd, setSelectingEnd] = useState(false);

  const goToPrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    // Padding before first day
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Days
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Padding after to fill last row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewYear, viewMonth]);

  const handleDayPress = useCallback(
    (day: number) => {
      const dateStr = formatISO(viewYear, viewMonth, day);
      if (dateStr < min) return;

      if (!selectingEnd || !dateFrom) {
        // Selecting start date
        onDateFromChange(dateStr);
        onDateToChange('');
        setSelectingEnd(true);
      } else {
        // Selecting end date
        if (dateStr < dateFrom) {
          // User picked earlier date — swap: new start = clicked, clear end
          onDateFromChange(dateStr);
          onDateToChange('');
        } else {
          onDateToChange(dateStr);
          setSelectingEnd(false);
        }
      }
    },
    [viewYear, viewMonth, dateFrom, selectingEnd, min, onDateFromChange, onDateToChange],
  );

  const isInRange = useCallback(
    (dateStr: string) => {
      if (!dateFrom || !dateTo) return false;
      return dateStr >= dateFrom && dateStr <= dateTo;
    },
    [dateFrom, dateTo],
  );

  const isStart = useCallback((dateStr: string) => dateStr === dateFrom, [dateFrom]);
  const isEnd = useCallback((dateStr: string) => dateStr === dateTo, [dateTo]);

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthRow}>
        <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.dayCell}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.daysGrid}>
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.dayCell} />;
          }

          const dateStr = formatISO(viewYear, viewMonth, day);
          const disabled = dateStr < min;
          const start = isStart(dateStr);
          const end = isEnd(dateStr);
          const inRange = isInRange(dateStr);
          const isToday = dateStr === today;

          return (
            <Pressable
              key={dateStr}
              style={[
                styles.dayCell,
                inRange && styles.dayCellInRange,
                start && styles.dayCellStart,
                end && styles.dayCellEnd,
                (start || end) && styles.dayCellSelected,
              ]}
              onPress={() => !disabled && handleDayPress(day)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.dayText,
                  disabled && styles.dayDisabled,
                  isToday && styles.dayToday,
                  (start || end) && styles.daySelectedText,
                  inRange && !start && !end && styles.dayInRangeText,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selection hint */}
      <Text style={styles.hint}>
        {!dateFrom
          ? 'Выберите дату начала'
          : !dateTo
            ? 'Выберите дату окончания'
            : ''}
      </Text>
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.heading,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.heading,
  },
  dayDisabled: {
    color: colors.textLight,
    opacity: 0.4,
  },
  dayToday: {
    fontWeight: '800',
    color: colors.primary,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: CELL_SIZE / 2,
  },
  daySelectedText: {
    color: colors.white,
    fontWeight: '700',
  },
  dayCellInRange: {
    backgroundColor: 'rgba(123, 45, 62, 0.1)',
  },
  dayCellStart: {
    borderTopLeftRadius: CELL_SIZE / 2,
    borderBottomLeftRadius: CELL_SIZE / 2,
  },
  dayCellEnd: {
    borderTopRightRadius: CELL_SIZE / 2,
    borderBottomRightRadius: CELL_SIZE / 2,
  },
  dayInRangeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
    height: 18,
  },
});
