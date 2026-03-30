import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, EmptyStateIllustration } from '../../components';
import { spacing, radius, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';
import { useAuthStore } from '../../store/authStore';
import {
  useNotificationStore,
  type AppNotification,
  type NotificationType,
} from '../../store/notificationStore';

// Icon config per notification type — icons only, bg resolved at render time
const NOTIFICATION_ICON_KEYS: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; bgKey: 'primaryLight' | 'successLight' | 'dangerLight' | 'accentLight' }
> = {
  new_task: { icon: 'clipboard-outline', bgKey: 'primaryLight' },
  task_approved: { icon: 'checkmark-circle-outline', bgKey: 'successLight' },
  task_rejected: { icon: 'alert-circle-outline', bgKey: 'dangerLight' },
  new_message: { icon: 'chatbubble-outline', bgKey: 'accentLight' },
  stage_started: { icon: 'play-outline', bgKey: 'primaryLight' },
  stage_completed: { icon: 'flag-outline', bgKey: 'successLight' },
  master_offer: { icon: 'hand-left-outline', bgKey: 'accentLight' },
  master_accepted: { icon: 'checkmark-done-outline', bgKey: 'successLight' },
  master_declined: { icon: 'close-circle-outline', bgKey: 'dangerLight' },
  schedule_reminder: { icon: 'calendar-outline', bgKey: 'primaryLight' },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days === 1) return 'Вчера';
  return `${days} дн. назад`;
}

export function NotificationsScreen() {
  const { colors, glass, isDark } = useTheme();
  const styles = useNotificationsScreenStyles(colors, glass, isDark);
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const { notifications, loadNotifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();

  useEffect(() => {
    if (user) loadNotifications(user.id);
  }, [user]);

  const handleNotificationPress = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // Navigate to relevant screen based on notification type (BUG-25)
    const meta = (notification as any).data as Record<string, string> | undefined;
    const projectId = notification.project_id || meta?.project_id;
    const stageId = notification.stage_id || meta?.stage_id;

    if (projectId) {
      switch (notification.type) {
        case 'new_message':
          navigation.navigate('Chat', { projectId });
          break;
        case 'master_offer':
        case 'schedule_reminder':
          navigation.navigate('ProjectDetail', { projectId });
          break;
        case 'task_approved':
        case 'task_rejected':
        case 'stage_started':
        case 'stage_completed':
        case 'new_task':
        case 'master_accepted':
        case 'master_declined':
          navigation.navigate('ProjectDetail', { projectId });
          break;
      }
    }
  };

  const handleMarkAllRead = () => {
    if (user && unreadCount() > 0) {
      markAllAsRead(user.id);
    }
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const iconConfig = NOTIFICATION_ICON_KEYS[item.type] || NOTIFICATION_ICON_KEYS.new_message;

    return (
      <Pressable onPress={() => handleNotificationPress(item)}>
        <View
          style={[
            styles.notificationCard,
            !item.is_read && styles.notificationUnread,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors[iconConfig.bgKey] }]}>
            <Ionicons name={iconConfig.icon} size={18} color={colors.primary} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationText}>{item.body}</Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Уведомления</Text>
        {unreadCount() > 0 && (
          <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Прочитать все</Text>
          </Pressable>
        )}
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <EmptyStateIllustration variant="no-notifications" />
        </View>
      )}
    </ScreenWrapper>
  );
}

function useNotificationsScreenStyles(colors: ThemeColors, glass: GlassTokens, isDark: boolean) {
  return useMemo(
    () =>
      StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
  },
  markAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  markAllText: {
    ...typography.small,
    color: colors.primary,
  },
  list: {
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? glass.fill.light : glass.fill.light,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: isDark ? glass.border.light : glass.border.light,
    // Glass shadow
    shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(123, 45, 62, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: isDark ? glass.fill.tinted : glass.fill.tinted,
    borderColor: colors.borderHover,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  notificationText: {
    ...typography.body,
    color: colors.text,
    marginBottom: 4,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
}),
    [colors, glass, isDark],
  );
}

