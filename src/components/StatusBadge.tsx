import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { StageStatus, ProjectStatus, STAGE_STATUS_LABELS, PROJECT_STATUS_LABELS } from '../types';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: colors.primaryLight, text: colors.primary },
  planning: { bg: colors.accentLight, text: '#8B7332' },
  pending: { bg: '#F0EDE6', text: colors.textLight },
  in_progress: { bg: colors.primaryLight, text: colors.primary },
  done_by_master: { bg: 'rgba(255, 149, 0, 0.12)', text: '#CC7700' },
  approved: { bg: colors.successLight, text: '#1B7A3A' },
  completed: { bg: colors.successLight, text: '#1B7A3A' },
  rejected: { bg: colors.dangerLight, text: colors.danger },
  cancelled: { bg: colors.dangerLight, text: colors.danger },
};

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  new: 'sparkles-outline',
  planning: 'calendar-outline',
  pending: 'time-outline',
  in_progress: 'play-circle-outline',
  done_by_master: 'checkmark-circle-outline',
  approved: 'checkmark-done-outline',
  completed: 'trophy-outline',
  rejected: 'close-circle-outline',
  cancelled: 'ban-outline',
};

interface StatusBadgeProps {
  status: StageStatus | ProjectStatus;
  type?: 'stage' | 'project';
}

export function StatusBadge({ status, type = 'stage' }: StatusBadgeProps) {
  const colorSet = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const labels = type === 'stage' ? STAGE_STATUS_LABELS : PROJECT_STATUS_LABELS;
  const label = labels[status as keyof typeof labels] || status;
  const iconName = STATUS_ICONS[status];

  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }]}>
      {iconName && (
        <Ionicons name={iconName} size={12} color={colorSet.text} />
      )}
      <Text style={[styles.text, { color: colorSet.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
