import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { spacing, radius, glass } from '../theme';
import { useTheme } from '../theme/ThemeContext';

type CardVariant = 'default' | 'glass' | 'elevated' | 'solid';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** default = frosted glass on gradient bg, glass = heavy blur, elevated = shadow, solid = opaque */
  variant?: CardVariant;
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { isDark, colors, glass } = useTheme();

  // Heavy glass — with BlurView on iOS
  if (variant === 'glass') {
    if (Platform.OS === 'ios') {
      return (
        <View style={[styles.glassOuter, glass.shadow, style]}>
          <BlurView
            intensity={glass.blur.medium}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurFill}
          >
            <View style={[styles.glassInner, { backgroundColor: glass.fill.light, borderColor: glass.border.light }]}>
              {children}
            </View>
          </BlurView>
        </View>
      );
    }
    // Android fallback
    return (
      <View style={[styles.glassOuter, glass.shadow, { backgroundColor: glass.fill.light, borderWidth: 1, borderColor: glass.border.light }, style]}>
        <View style={[styles.glassInner, { backgroundColor: glass.fill.light, borderColor: glass.border.light }]}>
          {children}
        </View>
      </View>
    );
  }

  if (variant === 'elevated') {
    return (
      <View style={[styles.elevated, {
        backgroundColor: isDark ? colors.bgElevated : 'rgba(255, 255, 255, 0.85)',
        borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.9)',
      }, style]}>
        {children}
      </View>
    );
  }

  if (variant === 'solid') {
    return (
      <View style={[styles.solid, { backgroundColor: colors.bgCard, borderColor: colors.border }, style]}>
        {children}
      </View>
    );
  }

  // Default — Liquid Glass card (translucent)
  return (
    <View style={[styles.card, {
      backgroundColor: isDark ? 'rgba(22, 22, 31, 0.8)' : 'rgba(255, 255, 255, 0.65)',
      borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.8)',
      shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(123, 45, 62, 0.06)',
    }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  solid: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  elevated: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  glassOuter: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  blurFill: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  glassInner: {
    padding: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
});
