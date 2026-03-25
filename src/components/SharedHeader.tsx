import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, glass } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface SharedHeaderProps {
  title: string;
  subtitle?: string;
  avatarUri?: string;
  onAvatarPress: () => void;
  notificationCount?: number;
  onNotificationPress: () => void;
  rightAction?: React.ReactNode;
}

export function SharedHeader({
  title,
  subtitle,
  onAvatarPress,
  notificationCount = 0,
  onNotificationPress,
  rightAction,
}: SharedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, glass } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.heading }]} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textLight }]} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {rightAction}

        <Pressable
          onPress={onNotificationPress}
          style={[styles.iconButton, { backgroundColor: glass.fill.light, borderColor: glass.border.light }]}
          hitSlop={8}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.heading} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={onAvatarPress}
          style={styles.avatarButton}
          hitSlop={4}
          accessibilityLabel="Profile"
        >
          <View style={[styles.avatar, { backgroundColor: glass.fill.light, borderColor: glass.border.light }]}>
            <Ionicons name="person" size={18} color={colors.primary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    minHeight: 56,
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
  },
  avatarButton: {
    // no extra styling needed
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
