import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import {
  useNotificationStore,
  type AppNotification,
  type NotificationType,
} from '../../store/notificationStore';

// Icon config per notification type
const NOTIFICATION_ICONS: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; bg: string }
> = {
  new_task: { icon: 'clipboard-outline', bg: colors.primaryLight },
  task_approved: { icon: 'checkmark-circle-outline', bg: colors.successLight },
  task_rejected: { icon: 'alert-circle-outline', bg: colors.dangerLight },
  new_message: { icon: 'chatbubble-outline', bg: colors.accentLight },
  stage_started: { icon: 'play-outline', bg: colors.primaryLight },
  stage_completed: { icon: 'flag-outline', bg: colors.successLight },
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
    const meta = notification.metadata as Record<string, string> | undefined;
    const projectId = meta?.project_id;
    const stageId = meta?.stage_id;

    if (projectId) {
      switch (notification.type) {
        case 'new_message':
          navigation.navigate('Chat', { projectId });
          break;
        case 'task_approved':
        case 'task_rejected':
        case 'stage_started':
        case 'stage_completed':
        case 'new_task':
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
    const iconConfig = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.new_message;

    return (
      <Pressable onPress={() => handleNotificationPress(item)}>
        <View
          style={[
            styles.notificationCard,
            !item.is_read && styles.notificationUnread,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
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
          <Ionicons
            name="notifications-outline"
            size={56}
            color={colors.primary}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={styles.emptyTitle}>Пока нет уведомлений</Text>
          <Text style={styles.emptyText}>
            Здесь будут появляться обновления{'\n'}по вашим задачам
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: 'rgba(123, 45, 62, 0.08)',
    borderColor: 'rgba(123, 45, 62, 0.15)',
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
});
