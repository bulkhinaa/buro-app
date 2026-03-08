import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius } from '../theme';
import { glass } from '../theme/glass';

type CardVariant = 'default' | 'glass' | 'elevated' | 'solid';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** default = frosted glass on gradient bg, glass = heavy blur, elevated = white shadow, solid = old-style opaque */
  variant?: CardVariant;
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  // Heavy glass — with BlurView on iOS
  if (variant === 'glass') {
    if (Platform.OS === 'ios') {
      return (
        <View style={[styles.glassOuter, style]}>
          <BlurView
            intensity={glass.blur.medium}
            tint="light"
            style={styles.blurFill}
          >
            <View style={styles.glassInner}>{children}</View>
          </BlurView>
        </View>
      );
    }
    // Android fallback
    return (
      <View style={[styles.glassOuter, styles.glassAndroid, style]}>
        <View style={styles.glassInner}>{children}</View>
      </View>
    );
  }

  if (variant === 'elevated') {
    return (
      <View style={[styles.elevated, style]}>{children}</View>
    );
  }

  if (variant === 'solid') {
    return (
      <View style={[styles.solid, style]}>{children}</View>
    );
  }

  // Default — Liquid Glass card (translucent white)
  return (
    <View style={[styles.card, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  // Default — Liquid Glass lite (translucent white on gradient bg)
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    // Subtle glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  // Solid — opaque card for contrast sections
  solid: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  // Elevated — white with strong shadow
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  // Heavy glass — with BlurView
  glassOuter: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...glass.shadow,
  },
  glassAndroid: {
    backgroundColor: glass.fill.light,
    borderWidth: 1,
    borderColor: glass.border.light,
  },
  blurFill: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  glassInner: {
    padding: spacing.xl,
    backgroundColor: glass.fill.light,
    borderWidth: 1,
    borderColor: glass.border.light,
    borderRadius: radius.xl,
  },
});
