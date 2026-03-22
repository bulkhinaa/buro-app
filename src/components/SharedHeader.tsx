import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {rightAction}

        <Pressable
          onPress={onNotificationPress}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.heading} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
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
        >
          <View style={styles.avatar}>
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
    color: colors.heading,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textLight,
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
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
    backgroundColor: colors.danger,
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
