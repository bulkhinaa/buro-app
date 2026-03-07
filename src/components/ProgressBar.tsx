import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  trackColor?: string;
  height?: number;
  label?: string;
  timeLabel?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  trackColor = colors.border,
  height = 6,
  label,
  timeLabel,
  showPercentage = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.headerRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && <Text style={[styles.percentage, { color }]}>{percentage}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: color,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
      {timeLabel && (
        <View style={styles.footerRow}>
          {label && <Text style={styles.footerLabel}>{label}</Text>}
          <Text style={[styles.timeLabel, { color }]}>{timeLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.small,
    color: colors.textLight,
  },
  percentage: {
    ...typography.bodyBold,
  },
  track: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.full,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerLabel: {
    ...typography.small,
    color: colors.textLight,
  },
  timeLabel: {
    ...typography.bodyBold,
  },
});
