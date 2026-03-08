import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

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
  const isSmall = size === 'sm';

  const content = (
    <View
      style={[
        styles.chip,
        isSmall && styles.chipSmall,
        selected && styles.chipSelected,
      ]}
    >
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      {avatarUri && (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      )}
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          selected && styles.labelSelected,
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  chipSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(123, 45, 62, 0.15)',
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
    color: colors.primary,
  },
  labelSmall: {
    ...typography.small,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
