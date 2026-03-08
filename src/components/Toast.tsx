import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme';
import { useToastStore, ToastType } from '../store/toastStore';

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  error: 'alert-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
  warning: 'warning',
};

const BG_COLORS: Record<ToastType, string> = {
  error: '#FF3B30',
  success: '#34C759',
  info: colors.primary,
  warning: '#FF9500',
};

/**
 * Global toast overlay. Mount ONCE at the root of the app (e.g. in App.tsx).
 * Usage: `useToastStore.getState().show('message')` or via the hook.
 */
export function Toast() {
  const { toast, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => hide());
  }, [translateY, opacity, hide]);

  useEffect(() => {
    if (!toast) return;

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Slide in
    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    timerRef.current = setTimeout(dismiss, toast.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;

  const bgColor = BG_COLORS[toast.type];
  const iconName = ICONS[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.sm },
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="box-none"
    >
      <Pressable onPress={dismiss} style={[styles.toast, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={20} color={colors.white} />
        <Text style={styles.text} numberOfLines={2}>
          {toast.text}
        </Text>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 99999,
    elevation: 99999,
    ...Platform.select({
      web: { position: 'fixed' as any },
    }),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  text: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    fontWeight: '600',
  },
});
