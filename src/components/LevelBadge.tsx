import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

export type MasterLevel = 'start' | 'profi' | 'expert';

interface LevelBadgeProps {
  level: MasterLevel;
  variant?: 'outline' | 'filled';
  size?: 'sm' | 'md';
}

const LEVEL_LABELS: Record<MasterLevel, string> = {
  start: 'Старт',
  profi: 'Профи',
  expert: 'Эксперт',
};

const LEVEL_ICONS: Record<MasterLevel, keyof typeof Ionicons.glyphMap> = {
  start: 'shield-outline',
  profi: 'shield-half-outline',
  expert: 'shield-checkmark',
};

export function LevelBadge({
  level,
  variant = 'outline',
  size = 'md',
}: LevelBadgeProps) {
  const isFilled = variant === 'filled';
  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        isFilled && styles.badgeFilled,
        !isFilled && styles.badgeOutline,
      ]}
    >
      <Ionicons
        name={LEVEL_ICONS[level]}
        size={iconSize}
        color={isFilled ? colors.white : colors.primary}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          size === 'sm' && styles.labelSm,
          isFilled && styles.labelFilled,
        ]}
      >
        {LEVEL_LABELS[level]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  badgeFilled: {
    backgroundColor: colors.primary,
  },
  badgeOutline: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    ...typography.small,
    fontWeight: '600',
    color: colors.primary,
  },
  labelSm: {
    fontSize: 11,
  },
  labelFilled: {
    color: colors.white,
  },
});
