import React, { useRef, useCallback, useMemo, useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Platform,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, radius } from '../theme/spacing';
import type { ThemeColors } from '../theme/colors';
import type { ScheduleSlot, ScheduleSlotStatus } from '../types';
import {
  SCHEDULE_HOURS,
  DAY_LABELS_SHORT,
  getWeekDates,
  formatDate,
} from '../store/scheduleStore';
import { useTheme } from '../theme/ThemeContext';
import { hapticLight, hapticSuccess } from '../utils/haptics';
import { useTranslation } from 'react-i18next';

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
const DRAG_HINT_KEY = 'schedule_drag_hint_shown';
const PENDING_THROTTLE_MS = 50;

type WeekGridStyles = ReturnType<typeof createStyles>;

interface GridCellProps {
  cellKey: string;
  bgColor: string;
  isPending: boolean;
  pendingColor: string;
  isBooked: boolean;
  textColor: string;
  isFirstCol: boolean;
  isFirstRow: boolean;
  styles: WeekGridStyles;
}

/** Memoised cell to avoid full grid re-renders during drag */
const GridCell = memo(function GridCell({
  bgColor,
  isPending,
  pendingColor,
  isBooked,
  textColor,
  isFirstCol,
  isFirstRow,
  styles,
}: GridCellProps) {
  return (
    <View
      style={[
        styles.cell,
        { backgroundColor: isPending ? pendingColor : bgColor },
        isFirstCol && styles.cellFirstCol,
        isFirstRow && styles.cellFirstRow,
      ]}
    >
      {isBooked && (
        <Text style={[styles.cellIcon, { color: textColor }]}>●</Text>
      )}
    </View>
  );
});

/**
 * WeekGrid — 8:00-23:00 × Mon-Sun hourly schedule grid
 *
 * UX: Tap toggles a single slot. Drag-select paints multiple slots.
 * Colors: light purple = available, dark purple = working, grey = booked (locked).
 * Haptic feedback on drag start and release.
 * Visual highlight of pending cells during drag.
 */
export function WeekGrid({
  weekStart,
  slots,
  masterId,
  onToggleSlot,
  onDragSelect,
  readOnly = false,
}: WeekGridProps) {
  const { colors: themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { t } = useTranslation();
  const gridRef = useRef<View>(null);
  const gridLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const draggedSlots = useRef<Set<string>>(new Set());
  const dragStatus = useRef<ScheduleSlotStatus>('working');
  const isDragging = useRef(false);
  const lastUpdateTime = useRef(0);

  // Realtime drag highlight
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  // First-visit drag hint
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (readOnly) return;
    AsyncStorage.getItem(DRAG_HINT_KEY).then((val) => {
      if (!val) {
        setShowHint(true);
        AsyncStorage.setItem(DRAG_HINT_KEY, '1');
        const timer = setTimeout(() => setShowHint(false), 3000);
        return () => clearTimeout(timer);
      }
    });
  }, [readOnly]);

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
        // Re-measure grid position on each touch start to handle scroll offset changes
        gridRef.current?.measureInWindow((x, y, width, height) => {
          gridLayout.current = { x, y, width, height };
        });

        const { pageX, pageY } = evt.nativeEvent;
        const cell = touchToCell(pageX, pageY);
        if (!cell) return;

        const status = getSlotStatus(cell.date, cell.hour);
        if (status === 'booked') return;

        // Haptic on drag start
        hapticLight();

        // Hide hint on first drag
        if (showHint) setShowHint(false);

        isDragging.current = false;
        const key = `${cell.date}-${cell.hour}`;
        draggedSlots.current = new Set([key]);
        // Determine paint mode: if cell is working → paint available, else → paint working
        dragStatus.current = status === 'working' ? 'available' : 'working';

        // Show pending highlight immediately
        setPendingCells(new Set([key]));
        lastUpdateTime.current = Date.now();
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

          // Throttled state update for pending highlight (max once per 50ms)
          const now = Date.now();
          if (now - lastUpdateTime.current >= PENDING_THROTTLE_MS) {
            lastUpdateTime.current = now;
            setPendingCells(new Set(draggedSlots.current));
          }
        }
      },
      onPanResponderRelease: () => {
        const selectedSlots = Array.from(draggedSlots.current).map((key) => {
          const [date, hourStr] = key.split(/-(?=\d+$)/);
          return { date, hour: parseInt(hourStr, 10) };
        });

        // Haptic on release
        if (isDragging.current && selectedSlots.length > 1) {
          hapticSuccess();
          onDragSelect(selectedSlots, dragStatus.current);
        } else if (selectedSlots.length === 1) {
          hapticLight();
          onToggleSlot(selectedSlots[0].date, selectedSlots[0].hour);
        }

        // Clear pending highlight
        setPendingCells(new Set());
        draggedSlots.current.clear();
        isDragging.current = false;
      },
    });
  }, [readOnly, touchToCell, getSlotStatus, onToggleSlot, onDragSelect, showHint]);

  const getCellColor = (status: ScheduleSlotStatus): string => {
    switch (status) {
      case 'working':
        return themeColors.primary;
      case 'booked':
        return '#C7C7CC'; // System grey
      case 'available':
      default:
        return themeColors.primaryLight;
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
        return themeColors.textLight;
    }
  };

  // Pending cell highlight color — semi-transparent primary
  const pendingColor = `${themeColors.primary}66`; // ~40% opacity

  return (
    <View
      ref={gridRef}
      style={styles.container}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Drag hint — shown once on first visit */}
      {showHint && (
        <View style={[styles.hintBar, { backgroundColor: `${themeColors.primary}15` }]}>
          <Text style={[styles.hintText, { color: themeColors.primary }]}>
            {t('schedule.dragHint')}
          </Text>
        </View>
      )}

      {/* Header row: day labels + date numbers */}
      <View style={styles.headerRow}>
        <View style={styles.hourColumn} />
        {weekDates.map((date, i) => {
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <View key={i} style={styles.dayHeader}>
              <Text style={[styles.dayLabel, isToday && { color: themeColors.primary }]}>
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
            const key = `${date}-${hour}`;
            return (
              <GridCell
                key={key}
                cellKey={key}
                bgColor={getCellColor(status)}
                isPending={pendingCells.has(key)}
                pendingColor={pendingColor}
                isBooked={status === 'booked'}
                textColor={getCellTextColor(status)}
                isFirstCol={dayIdx === 0}
                isFirstRow={hourIdx === 0}
                styles={styles}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: c.bgCard,
      ...(Platform.OS === 'web' ? { userSelect: 'none' } as any : {}),
    },
    hintBar: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    hintText: {
      fontSize: 12,
      fontWeight: '500',
    },
    headerRow: {
      flexDirection: 'row',
      height: HEADER_HEIGHT,
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
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
      color: c.textLight,
      textTransform: 'uppercase',
    },
    dateNumber: {
      fontSize: 12,
      fontWeight: '700',
      color: c.heading,
      marginTop: 1,
    },
    todayNumber: {
      color: c.textBright,
      backgroundColor: c.primary,
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
      color: c.textLight,
    },
    cell: {
      flex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
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
