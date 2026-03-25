import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Stage, StageStatus, STAGE_STATUS_LABELS } from '../types';

interface ProjectTimelineProps {
  stages: Stage[];
  onStagePress?: (stage: Stage) => void;
}

const STATUS_COLORS: Record<StageStatus, string> = {
  pending: colors.border,
  in_progress: colors.primary,
  done_by_master: '#FF9500',
  approved: colors.success,
  rejected: colors.danger,
};

const STATUS_ICONS: Record<StageStatus, string> = {
  pending: 'ellipse-outline',
  in_progress: 'hammer',
  done_by_master: 'eye',
  approved: 'checkmark',
  rejected: 'close',
};

export function ProjectTimeline({ stages, onStagePress }: ProjectTimelineProps) {
  const { colors: themeColors, glass, isDark } = useTheme();
  return (
    <View style={styles.container}>
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;
        const color = STATUS_COLORS[stage.status];
        const isDone = stage.status === 'approved';
        const isActive = stage.status === 'in_progress';
        const isRejected = stage.status === 'rejected';
        const isReview = stage.status === 'done_by_master';

        return (
          <Pressable
            key={stage.id}
            style={styles.row}
            onPress={() => onStagePress?.(stage)}
          >
            {/* Timeline column */}
            <View style={styles.timelineCol}>
              {/* Node */}
              <View
                style={[
                  styles.node,
                  { backgroundColor: color },
                  (isActive || isReview) && styles.nodeActive,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                ) : isRejected ? (
                  <Ionicons name="close" size={12} color={colors.white} />
                ) : isActive ? (
                  <Ionicons name="hammer" size={10} color={colors.white} />
                ) : isReview ? (
                  <Ionicons name="eye" size={10} color={colors.white} />
                ) : (
                  <Text style={styles.nodeNumber}>{stage.order_index}</Text>
                )}
              </View>
              {/* Connecting line */}
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: isDone
                        ? colors.success
                        : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                />
              )}
            </View>

            {/* Content */}
            <View
              style={[
                styles.content,
                isActive && styles.contentActive,
                isRejected && styles.contentRejected,
              ]}
            >
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    isDone && styles.titleDone,
                  ]}
                  numberOfLines={1}
                >
                  {stage.title}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.statusText, { color }]}>
                    {STAGE_STATUS_LABELS[stage.status]}
                  </Text>
                </View>
              </View>

              {/* Date info */}
              <View style={styles.dateRow}>
                {stage.deadline && (
                  <View style={styles.dateItem}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textLight} />
                    <Text style={styles.dateText}>
                      до {new Date(stage.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                )}
                {stage.started_at && (
                  <View style={styles.dateItem}>
                    <Ionicons name="play-outline" size={12} color={colors.textLight} />
                    <Text style={styles.dateText}>
                      {new Date(stage.started_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                )}
                {stage.approved_at && (
                  <View style={styles.dateItem}>
                    <Ionicons name="checkmark-circle-outline" size={12} color={colors.success} />
                    <Text style={[styles.dateText, { color: colors.success }]}>
                      {new Date(stage.approved_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    minHeight: 60,
  },
  // Timeline column
  timelineCol: {
    width: 32,
    alignItems: 'center',
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  nodeActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
    borderRadius: 1,
  },
  // Content
  content: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.lg,
    paddingRight: spacing.xs,
  },
  contentActive: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  contentRejected: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
  },
  titleDone: {
    color: colors.textLight,
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    ...typography.caption,
    color: colors.textLight,
  },
});
