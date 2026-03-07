import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';

interface Notification {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  text: string;
  time: string;
  isRead: boolean;
  projectId?: string;
}

// Mock notifications — will be replaced with real data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: 'person-outline',
    iconBg: colors.primaryLight,
    text: 'Вам назначен супервайзер Алексей Петров',
    time: '2 часа назад',
    isRead: false,
    projectId: 'sp-1',
  },
  {
    id: '2',
    icon: 'checkmark-circle-outline',
    iconBg: colors.successLight,
    text: 'Мастер завершил этап «Штукатурка стен»',
    time: '5 часов назад',
    isRead: false,
    projectId: 'sp-1',
  },
  {
    id: '3',
    icon: 'chatbubble-outline',
    iconBg: colors.accentLight,
    text: 'Новое сообщение от супервайзера',
    time: 'Вчера',
    isRead: true,
    projectId: 'sp-1',
  },
  {
    id: '4',
    icon: 'notifications-outline',
    iconBg: colors.primaryLight,
    text: 'Начался этап «Электрика (черновая)»',
    time: '2 дня назад',
    isRead: true,
    projectId: 'sp-1',
  },
];

export function NotificationsScreen() {
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable>
      <View
        style={[
          styles.notificationCard,
          !item.isRead && styles.notificationUnread,
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>{item.text}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </Pressable>
  );

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.title}>Уведомления</Text>

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
          <Ionicons name="notifications-outline" size={56} color={colors.primary} style={{ marginBottom: spacing.lg }} />
          <Text style={styles.emptyTitle}>Пока нет уведомлений</Text>
          <Text style={styles.emptyText}>
            Здесь будут появляться обновления{'\n'}по вашим проектам
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.heading,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  list: {
    paddingBottom: spacing.huge,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationUnread: {
    backgroundColor: colors.primaryLight,
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
  notificationText: {
    ...typography.body,
    color: colors.heading,
    marginBottom: 2,
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
