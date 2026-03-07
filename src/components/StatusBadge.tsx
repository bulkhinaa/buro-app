import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { StageStatus, ProjectStatus, STAGE_STATUS_LABELS, PROJECT_STATUS_LABELS } from '../types';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: colors.primaryLight, text: colors.primary },
  planning: { bg: colors.accentLight, text: '#8B7332' },
  pending: { bg: '#F0EDE6', text: colors.textLight },
  in_progress: { bg: colors.primaryLight, text: colors.primary },
  done_by_master: { bg: 'rgba(255, 149, 0, 0.12)', text: '#CC7700' },
  approved: { bg: colors.successLight, text: '#1E8B3E' },
  completed: { bg: colors.successLight, text: '#1E8B3E' },
  rejected: { bg: colors.dangerLight, text: colors.danger },
  cancelled: { bg: colors.dangerLight, text: colors.danger },
};

interface StatusBadgeProps {
  status: StageStatus | ProjectStatus;
  type?: 'stage' | 'project';
}

export function StatusBadge({ status, type = 'stage' }: StatusBadgeProps) {
  const colorSet = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const labels = type === 'stage' ? STAGE_STATUS_LABELS : PROJECT_STATUS_LABELS;
  const label = labels[status as keyof typeof labels] || status;

  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }]}>
      <Text style={[styles.text, { color: colorSet.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
