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

// On web, stack navigator cards use position:absolute but children may lose
// height constraints, breaking ScrollView. This pins the wrapper to the card edges.
const webAbsoluteFill = Platform.OS === 'web'
  ? ({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any)
  : undefined;

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  /** Use plain white bg instead of gradient (for modals, etc.) */
  plain?: boolean;
  /** SafeAreaView edges override. Default: ['top']. Pass [] when React Navigation header already handles safe area. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenWrapper({
  children,
  scroll = true,
  style,
  padded = true,
  plain = false,
  edges = ['top'],
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
      <SafeAreaView style={[styles.plainContainer, webFullHeight, webAbsoluteFill]} edges={edges}>
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
      style={[styles.gradient, webFullHeight, webAbsoluteFill]}
    >
      <SafeAreaView style={styles.safeArea} edges={edges}>
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
