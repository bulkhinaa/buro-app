import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

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
  color,
  trackColor,
  height = 6,
  label,
  timeLabel,
  showPercentage = false,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.primary;
  const resolvedTrackColor = trackColor ?? colors.border;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.headerRow}>
          {label && <Text style={[styles.label, { color: colors.textLight }]}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.percentage, { color: resolvedColor }]}>{percentage}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: resolvedTrackColor }]}>
        <View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: resolvedColor,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
      {timeLabel && (
        <View style={styles.footerRow}>
          {label && <Text style={[styles.footerLabel, { color: colors.textLight }]}>{label}</Text>}
          <Text style={[styles.timeLabel, { color: resolvedColor }]}>{timeLabel}</Text>
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
  },
  timeLabel: {
    ...typography.bodyBold,
  },
});
