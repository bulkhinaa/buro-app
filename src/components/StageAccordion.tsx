import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, glass } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { StageStatus } from '../types';
import { formatRubles } from '../utils/calculator';

interface StageAccordionProps {
  index: number;
  title: string;
  description?: string;
  checklist?: string[];
  costMin?: number;
  costMax?: number;
  days?: number;
  status: StageStatus;
  deadline?: string;
  masterName?: string;
  defaultOpen?: boolean;
  onApprove?: () => void;
}

export function StageAccordion({
  index,
  title,
  description,
  checklist,
  costMin,
  costMax,
  days,
  status,
  deadline,
  masterName,
  defaultOpen = false,
  onApprove,
}: StageAccordionProps) {
  const { colors, glass, isDark } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 180 : 0);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 250 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const isDone = status === 'approved';
  const isActive = status === 'in_progress';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? glass.fill.regular : 'rgba(255, 255, 255, 0.65)',
          borderColor: isDark ? glass.border.regular : 'rgba(255, 255, 255, 0.85)',
          shadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(123, 45, 62, 0.06)',
        },
        isDone && {
          opacity: 0.7,
          backgroundColor: isDark ? 'rgba(62, 220, 132, 0.06)' : 'rgba(52, 199, 89, 0.05)',
        },
        isActive && {
          borderColor: isDark ? colors.borderHover : 'rgba(123, 45, 62, 0.15)',
          backgroundColor: isDark ? colors.primaryLight : 'rgba(123, 45, 62, 0.04)',
        },
      ]}
    >
      <Pressable onPress={toggleOpen} style={styles.header}>
        {/* Left: number circle + title */}
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.numberCircle,
              { backgroundColor: colors.primaryLight },
              isDone && { backgroundColor: colors.success },
              isActive && { backgroundColor: colors.primary },
            ]}
          >
            {isDone ? (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            ) : (
              <Text style={[styles.numberText, { color: colors.primary }]}>{index}</Text>
            )}
          </View>
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.title,
                { color: colors.heading },
                isDone && { color: colors.textLight, textDecorationLine: 'line-through' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {/* Meta row: cost + days + status */}
            <View style={styles.metaRow}>
              {costMin != null && costMax != null && (
                <Text style={[styles.costText, { color: colors.textLight }]}>
                  {formatRubles(costMin)} – {formatRubles(costMax)}
                </Text>
              )}
              {days != null && (
                <View
                  style={[
                    styles.daysBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(240, 201, 93, 0.1)'
                        : 'rgba(197, 165, 90, 0.1)',
                    },
                  ]}
                >
                  <Ionicons name="time-outline" size={12} color={colors.textLight} />
                  <Text style={[styles.daysText, { color: colors.accent }]}>~{days} дн.</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: status + chevron */}
        <View style={styles.headerRight}>
          <StatusBadge status={status} />
          <Animated.View style={[styles.chevron, chevronStyle]}>
            <Ionicons name="chevron-down" size={18} color={colors.textLight} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Expanded content */}
      {open && (
        <View style={styles.content}>
          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Description */}
          {description && (
            <Text style={[styles.description, { color: colors.text }]}>{description}</Text>
          )}

          {/* Checklist */}
          {checklist && checklist.length > 0 && (
            <View style={styles.checklist}>
              {checklist.map((item, i) => (
                <View key={i} style={styles.checkItem}>
                  <Ionicons
                    name={isDone ? 'checkbox' : 'square-outline'}
                    size={16}
                    color={isDone ? colors.success : colors.textLight}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      { color: colors.heading },
                      isDone && { color: colors.textLight, textDecorationLine: 'line-through' },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer info */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: isDark
                  ? glass.fill.subtle
                  : 'rgba(249, 247, 244, 0.8)',
              },
            ]}
          >
            <View style={styles.footerRow}>
              <Ionicons name="person-outline" size={14} color={colors.textLight} />
              <Text style={[styles.footerText, { color: colors.textLight }]}>
                {masterName || 'Мастер: не назначен'}
              </Text>
            </View>
            {deadline && (
              <View style={styles.footerRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                <Text style={[styles.footerText, { color: colors.textLight }]}>
                  до {new Date(deadline).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}
            {!deadline && (
              <View style={styles.footerRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                <Text style={[styles.footerText, { color: colors.textLight }]}>
                  После назначения супервайзера
                </Text>
              </View>
            )}
          </View>

          {/* Approve button */}
          {status === 'done_by_master' && onApprove && (
            <Button
              title="Подтвердить этап"
              onPress={onApprove}
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  numberText: {
    ...typography.smallBold,
    fontSize: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  costText: {
    ...typography.small,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  daysText: {
    ...typography.caption,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  chevron: {
    marginTop: spacing.xs,
  },
  // Content (expanded)
  content: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  checklist: {
    marginBottom: spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkText: {
    ...typography.body,
    flex: 1,
  },
  footer: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerText: {
    ...typography.small,
  },
});
