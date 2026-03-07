import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface DateCellProps {
  day: number;
  weekday: string;
  selected?: boolean;
  weekend?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function DateCell({
  day,
  weekday,
  selected = false,
  weekend = false,
  disabled = false,
  onPress,
}: DateCellProps) {
  const dayColor = selected
    ? colors.white
    : weekend
      ? colors.danger
      : colors.heading;

  const weekdayColor = selected
    ? colors.white
    : weekend
      ? colors.danger
      : colors.textLight;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.cell,
        selected && styles.cellSelected,
        disabled && styles.cellDisabled,
        pressed && !selected && styles.cellPressed,
      ]}
    >
      <Text style={[styles.day, { color: dayColor }]}>{day}</Text>
      <Text style={[styles.weekday, { color: weekdayColor }]}>{weekday}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 56,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  cellDisabled: {
    opacity: 0.4,
  },
  cellPressed: {
    backgroundColor: colors.bgCardHover,
  },
  day: {
    ...typography.h3,
    marginBottom: 2,
  },
  weekday: {
    ...typography.caption,
    textTransform: 'lowercase',
  },
});
