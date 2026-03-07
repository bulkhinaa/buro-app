import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface TimeCellProps {
  time: string;
  selected?: boolean;
  inactive?: boolean;
  onPress?: () => void;
}

export function TimeCell({
  time,
  selected = false,
  inactive = false,
  onPress,
}: TimeCellProps) {
  const textColor = selected
    ? colors.white
    : inactive
      ? colors.textLight
      : colors.heading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.cell,
        selected && styles.cellSelected,
        pressed && !selected && styles.cellPressed,
      ]}
    >
      <Text style={[styles.time, { color: textColor }]}>{time}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  cellPressed: {
    backgroundColor: colors.bgCardHover,
  },
  time: {
    ...typography.body,
    fontWeight: '500',
  },
});
