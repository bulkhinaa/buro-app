import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { spacing, radius, typography, glass } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface ChipProps {
  label: string;
  emoji?: string;
  avatarUri?: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  emoji,
  avatarUri,
  selected = false,
  onPress,
  size = 'md',
}: ChipProps) {
  const { colors, glass, isDark } = useTheme();
  const isSmall = size === 'sm';

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: isDark ? glass.fill.regular : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark ? glass.border.regular : 'rgba(255, 255, 255, 0.85)',
        },
        isSmall && styles.chipSmall,
        selected && {
          backgroundColor: colors.primaryLight,
          borderColor: isDark ? colors.borderHover : 'rgba(123, 45, 62, 0.15)',
        },
      ]}
    >
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      {avatarUri && (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      )}
      <Text
        style={[
          styles.label,
          { color: colors.primary },
          isSmall && styles.labelSmall,
          selected && { color: colors.primary, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={4}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  chipSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  emoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.body,
  },
  labelSmall: {
    ...typography.small,
  },
});
