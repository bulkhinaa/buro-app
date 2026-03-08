import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';

// On web (iOS PWA), flex:1 doesn't extend behind the home indicator.
// Using 100dvh forces the gradient to cover the full viewport including safe areas.
const webFullHeight = Platform.OS === 'web'
  ? ({ minHeight: '100dvh' } as any)
  : undefined;

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  /** Use plain white bg instead of gradient (for modals, etc.) */
  plain?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = true,
  style,
  padded = true,
  plain = false,
}: ScreenWrapperProps) {
  const content = (
    <View style={[styles.inner, padded && styles.padded, style]}>
      {children}
    </View>
  );

  const scrollable = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  if (plain) {
    return (
      <SafeAreaView style={[styles.plainContainer, webFullHeight]} edges={['top']}>
        {scrollable}
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={[
        colors.bgGradientStart,
        colors.bgGradientMid,
        colors.bgGradientEnd,
      ]}
      locations={[0, 0.4, 1]}
      style={[styles.gradient, webFullHeight]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {scrollable}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  plainContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
});
