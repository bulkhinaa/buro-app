import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/spacing';

type GlassIntensity = 'light' | 'regular' | 'subtle';

interface GlassViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: GlassIntensity;
  borderRadius?: number;
  noBorder?: boolean;
  tint?: 'light' | 'dark' | 'default';
}

/**
 * GlassView — Apple Liquid Glass container
 * Uses expo-blur on iOS, semi-transparent fallback on Android
 * Now theme-aware — reads glass tokens from ThemeContext
 */
export function GlassView({
  children,
  style,
  intensity = 'regular',
  borderRadius: br = radius.lg,
  noBorder = false,
  tint,
}: GlassViewProps) {
  const { glass, isDark } = useTheme();

  const blurMap: Record<GlassIntensity, number> = {
    light: glass.blur.light,
    regular: glass.blur.medium,
    subtle: glass.blur.heavy,
  };

  const fillMap: Record<GlassIntensity, string> = {
    light: glass.fill.light,
    regular: glass.fill.regular,
    subtle: glass.fill.subtle,
  };

  const borderMap: Record<GlassIntensity, string> = {
    light: glass.border.light,
    regular: glass.border.regular,
    subtle: glass.border.subtle,
  };

  const borderStyle = noBorder
    ? {}
    : { borderWidth: 1, borderColor: borderMap[intensity] };

  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          { borderRadius: br, overflow: 'hidden' as const },
          glass.shadow,
          style,
        ]}
      >
        <BlurView
          intensity={blurMap[intensity]}
          tint={resolvedTint}
          style={[styles.fill, { borderRadius: br }]}
        >
          <View
            style={[
              styles.innerOverlay,
              { backgroundColor: fillMap[intensity], borderRadius: br },
              borderStyle,
            ]}
          >
            {children}
          </View>
        </BlurView>
      </View>
    );
  }

  // Android fallback — no native blur, use semi-transparent bg
  return (
    <View
      style={[
        {
          borderRadius: br,
          backgroundColor: fillMap[intensity],
          overflow: 'hidden' as const,
        },
        glass.shadow,
        borderStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    overflow: 'hidden',
  },
  innerOverlay: {
    flex: 1,
  },
});
