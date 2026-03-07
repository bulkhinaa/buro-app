import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface ChipProps {
  label: string;
  emoji?: string;
  avatarUri?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({
  label,
  emoji,
  avatarUri,
  selected = false,
  onPress,
}: ChipProps) {
  const content = (
    <View
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
    >
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      {avatarUri && (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
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
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
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
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
