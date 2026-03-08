import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass } from '../theme/glass';
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

const BLUR_MAP: Record<GlassIntensity, number> = {
  light: glass.blur.light,
  regular: glass.blur.medium,
  subtle: glass.blur.heavy,
};

const FILL_MAP: Record<GlassIntensity, string> = {
  light: glass.fill.light,
  regular: glass.fill.regular,
  subtle: glass.fill.subtle,
};

const BORDER_MAP: Record<GlassIntensity, string> = {
  light: glass.border.light,
  regular: glass.border.regular,
  subtle: glass.border.subtle,
};

/**
 * GlassView — Apple Liquid Glass container
 * Uses expo-blur on iOS, semi-transparent fallback on Android
 */
export function GlassView({
  children,
  style,
  intensity = 'regular',
  borderRadius = radius.lg,
  noBorder = false,
  tint = 'light',
}: GlassViewProps) {
  const borderStyle = noBorder
    ? {}
    : { borderWidth: 1, borderColor: BORDER_MAP[intensity] };

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          { borderRadius, overflow: 'hidden' as const },
          glass.shadow,
          style,
        ]}
      >
        <BlurView
          intensity={BLUR_MAP[intensity]}
          tint={tint}
          style={[styles.fill, { borderRadius }]}
        >
          <View
            style={[
              styles.innerOverlay,
              { backgroundColor: FILL_MAP[intensity], borderRadius },
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
          borderRadius,
          backgroundColor: FILL_MAP[intensity],
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
