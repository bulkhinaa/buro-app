import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius, typography } from '../theme';
import { glass } from '../theme/glass';

interface GlassChipProps {
  label: string;
  onPress?: () => void;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
}

/**
 * GlassChip — Liquid Glass chip for image overlays
 * Semi-transparent with blur on iOS, translucent fallback on Android
 */
export function GlassChip({
  label,
  onPress,
  variant = 'light',
  size = 'md',
}: GlassChipProps) {
  const isLight = variant === 'light';
  const isSmall = size === 'sm';

  const chipContent = (
    <Text
      style={[
        styles.label,
        isSmall && styles.labelSmall,
        { color: isLight ? colors.heading : colors.white },
      ]}
    >
      {label}
    </Text>
  );

  const innerStyle = [
    styles.chip,
    isSmall && styles.chipSmall,
    {
      backgroundColor: isLight ? glass.fill.light : glass.fill.dark,
      borderColor: isLight ? glass.border.light : glass.border.subtle,
    },
  ];

  const wrapper = (content: React.ReactNode) => {
    if (Platform.OS === 'ios') {
      return (
        <View style={[styles.blurContainer, isSmall && styles.chipSmall]}>
          <BlurView
            intensity={glass.blur.light}
            tint={isLight ? 'light' : 'dark'}
            style={styles.blurFill}
          >
            <View style={innerStyle}>{content}</View>
          </BlurView>
        </View>
      );
    }
    return <View style={innerStyle}>{content}</View>;
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={4}>
        {wrapper(chipContent)}
      </Pressable>
    );
  }

  return wrapper(chipContent);
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: radius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  blurFill: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
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
  label: {
    ...typography.smallBold,
  },
  labelSmall: {
    ...typography.caption,
    fontWeight: '600',
  },
});
