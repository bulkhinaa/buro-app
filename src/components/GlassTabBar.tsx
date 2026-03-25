import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { spacing, radius, glass } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { hapticLight } from '../utils/haptics';

/**
 * GlassTabBar — Apple Liquid Glass floating tab bar
 * Rounded floating pill with blur on iOS, translucent on Android
 * Now theme-aware — adapts to dark mode
 */
export function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colors, glass, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  const content = (
    <View style={styles.inner}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            hapticLight();
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const color = isFocused ? colors.primary : colors.textLight;
        const badge = options.tabBarBadge;

        const icon = options.tabBarIcon
          ? options.tabBarIcon({ focused: isFocused, color, size: 24 })
          : null;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {/* Active pill background */}
            {isFocused && (
              <View
                style={[
                  styles.activePill,
                  {
                    backgroundColor: isDark
                      ? glass.fill.tinted
                      : 'rgba(123, 45, 62, 0.08)',
                  },
                ]}
              />
            )}
            <View>
              {icon}
              {badge != null && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>
                    {typeof badge === 'number' && badge > 9 ? '9+' : badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color },
                isFocused && styles.labelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, { paddingBottom: bottomPadding }]}>
        <View style={[styles.glassWrapper, { shadowColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)' }]}>
          <BlurView intensity={glass.blur.heavy} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            <View
              style={[
                styles.overlay,
                {
                  backgroundColor: isDark ? glass.fill.regular : 'rgba(255, 255, 255, 0.45)',
                  borderColor: isDark ? glass.border.regular : 'rgba(255, 255, 255, 0.7)',
                },
              ]}
            >
              {content}
            </View>
          </BlurView>
        </View>
      </View>
    );
  }

  // Android fallback
  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View
        style={[
          styles.glassWrapper,
          {
            backgroundColor: isDark ? colors.bgElevated : 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.98)',
          },
        ]}
      >
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  glassWrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  blur: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  overlay: {
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  inner: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    margin: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
