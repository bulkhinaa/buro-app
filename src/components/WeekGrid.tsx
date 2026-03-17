import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Platform,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import type { ScheduleSlot, ScheduleSlotStatus } from '../types';
import {
  SCHEDULE_HOURS,
  DAY_LABELS_SHORT,
  getWeekDates,
  formatDate,
} from '../store/scheduleStore';

interface WeekGridProps {
  weekStart: Date;
  slots: ScheduleSlot[];
  masterId: string;
  onToggleSlot: (date: string, hour: number) => void;
  onDragSelect: (slots: { date: string; hour: number }[], status: ScheduleSlotStatus) => void;
  readOnly?: boolean;
}

const CELL_HEIGHT = 36;
const HEADER_HEIGHT = 32;
const HOUR_COLUMN_WIDTH = 44;

/**
 * WeekGrid — 8:00-23:00 × Mon-Sun hourly schedule grid
 *
 * UX: Tap toggles a single slot. Drag-select paints multiple slots.
 * Colors: light purple = available, dark purple = working, grey = booked (locked).
 */
export function WeekGrid({
  weekStart,
  slots,
  masterId,
  onToggleSlot,
  onDragSelect,
  readOnly = false,
}: WeekGridProps) {
  const gridRef = useRef<View>(null);
  const gridLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const draggedSlots = useRef<Set<string>>(new Set());
  const dragStatus = useRef<ScheduleSlotStatus>('working');
  const isDragging = useRef(false);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const dateStrings = useMemo(() => weekDates.map(formatDate), [weekDates]);

  // Build a lookup map for quick slot access
  const slotMap = useMemo(() => {
    const map = new Map<string, ScheduleSlotStatus>();
    for (const s of slots) {
      map.set(`${s.date}-${s.hour}`, s.status);
    }
    return map;
  }, [slots]);

  const getSlotStatus = useCallback(
    (date: string, hour: number): ScheduleSlotStatus => {
      return slotMap.get(`${date}-${hour}`) || 'available';
    },
    [slotMap]
  );

  // Convert touch coordinates to grid cell
  const touchToCell = useCallback(
    (pageX: number, pageY: number): { date: string; hour: number; dayIdx: number; hourIdx: number } | null => {
      const { x, y, width } = gridLayout.current;
      const relX = pageX - x - HOUR_COLUMN_WIDTH;
      const relY = pageY - y - HEADER_HEIGHT;

      if (relX < 0 || relY < 0) return null;

      const cellWidth = (width - HOUR_COLUMN_WIDTH) / 7;
      const dayIdx = Math.floor(relX / cellWidth);
      const hourIdx = Math.floor(relY / CELL_HEIGHT);

      if (dayIdx < 0 || dayIdx > 6 || hourIdx < 0 || hourIdx >= SCHEDULE_HOURS.length) return null;

      return {
        date: dateStrings[dayIdx],
        hour: SCHEDULE_HOURS[hourIdx],
        dayIdx,
        hourIdx,
      };
    },
    [dateStrings]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    gridRef.current?.measureInWindow((x, y, width, height) => {
      gridLayout.current = { x, y, width, height };
    });
  }, []);

  const panResponder = useMemo(() => {
    if (readOnly) return { panHandlers: {} };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        const cell = touchToCell(pageX, pageY);
        if (!cell) return;

        const status = getSlotStatus(cell.date, cell.hour);
        if (status === 'booked') return;

        isDragging.current = false;
        draggedSlots.current = new Set([`${cell.date}-${cell.hour}`]);
        // Determine paint mode: if cell is working → paint available, else → paint working
        dragStatus.current = status === 'working' ? 'available' : 'working';
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        const cell = touchToCell(pageX, pageY);
        if (!cell) return;

        const status = getSlotStatus(cell.date, cell.hour);
        if (status === 'booked') return;

        const key = `${cell.date}-${cell.hour}`;
        if (!draggedSlots.current.has(key)) {
          isDragging.current = true;
          draggedSlots.current.add(key);
        }
      },
      onPanResponderRelease: () => {
        const selectedSlots = Array.from(draggedSlots.current).map((key) => {
          const [date, hourStr] = key.split(/-(?=\d+$)/);
          return { date, hour: parseInt(hourStr, 10) };
        });

        if (isDragging.current && selectedSlots.length > 1) {
          // Drag select: batch toggle
          onDragSelect(selectedSlots, dragStatus.current);
        } else if (selectedSlots.length === 1) {
          // Single tap
          onToggleSlot(selectedSlots[0].date, selectedSlots[0].hour);
        }

        draggedSlots.current.clear();
        isDragging.current = false;
      },
    });
  }, [readOnly, touchToCell, getSlotStatus, onToggleSlot, onDragSelect]);

  const getCellColor = (status: ScheduleSlotStatus): string => {
    switch (status) {
      case 'working':
        return colors.primary;
      case 'booked':
        return '#C7C7CC'; // System grey
      case 'available':
      default:
        return 'rgba(123, 45, 62, 0.08)';
    }
  };

  const getCellTextColor = (status: ScheduleSlotStatus): string => {
    switch (status) {
      case 'working':
        return '#FFFFFF';
      case 'booked':
        return '#8E8E93';
      case 'available':
      default:
        return colors.textLight;
    }
  };

  return (
    <View
      ref={gridRef}
      style={styles.container}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Header row: day labels + date numbers */}
      <View style={styles.headerRow}>
        <View style={styles.hourColumn} />
        {weekDates.map((date, i) => {
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <View key={i} style={styles.dayHeader}>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {DAY_LABELS_SHORT[i]}
              </Text>
              <Text style={[styles.dateNumber, isToday && styles.todayNumber]}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Grid rows: hours */}
      {SCHEDULE_HOURS.map((hour, hourIdx) => (
        <View key={hour} style={styles.row}>
          <View style={styles.hourColumn}>
            <Text style={styles.hourLabel}>{`${hour}:00`}</Text>
          </View>
          {dateStrings.map((date, dayIdx) => {
            const status = getSlotStatus(date, hour);
            return (
              <View
                key={`${date}-${hour}`}
                style={[
                  styles.cell,
                  {
                    backgroundColor: getCellColor(status),
                  },
                  dayIdx === 0 && styles.cellFirstCol,
                  hourIdx === 0 && styles.cellFirstRow,
                ]}
              >
                {status === 'booked' && (
                  <Text style={[styles.cellIcon, { color: getCellTextColor(status) }]}>●</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    ...(Platform.OS === 'web' ? { userSelect: 'none' } as any : {}),
  },
  headerRow: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  hourColumn: {
    width: HOUR_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  dateNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.heading,
    marginTop: 1,
  },
  todayLabel: {
    color: colors.primary,
  },
  todayNumber: {
    color: '#FFFFFF',
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    height: CELL_HEIGHT,
  },
  hourLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textLight,
  },
  cell: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFirstCol: {
    borderLeftWidth: 0,
  },
  cellFirstRow: {
    borderTopWidth: 0,
  },
  cellIcon: {
    fontSize: 8,
  },
});
