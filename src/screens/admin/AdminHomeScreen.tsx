import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, SharedHeader } from '../../components';
import { hapticLight } from '../../utils/haptics';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAdminStore } from '../../store/adminStore';

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'document-text-outline', label: 'Заявки', route: 'AdminRequests', color: colors.primary },
  { icon: 'megaphone-outline', label: 'Лиды', route: 'AdminLeads', color: colors.gold },
  { icon: 'people-outline', label: 'Пользователи', route: 'AdminUsers', color: colors.success },
  { icon: 'book-outline', label: 'База знаний', route: 'AdminTemplates', color: colors.adminPurple },
];

export function AdminHomeScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.is_read).length);
  const stats = useAdminStore((s) => s.stats);
  const isLoading = useAdminStore((s) => s.isLoading);
  const fetchAll = useAdminStore((s) => s.fetchAll);

  const loadData = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SharedHeader
          title={user?.name || 'Администратор'}
          subtitle="Админ-панель"
          onAvatarPress={() => navigation.navigate('Profile')}
          notificationCount={unreadCount}
          onNotificationPress={() => navigation.navigate('NotificationsStack')}
        />

        {/* Stats grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              number={stats.newProjects}
              label="Новых заявок"
              color={colors.primary}
              onPress={() => navigation.navigate('AdminRequests')}
            />
            <StatCard
              number={stats.activeProjects}
              label="Активных"
              color={colors.gold}
              onPress={() => navigation.navigate('AdminRequests')}
            />
            <StatCard
              number={stats.totalMasters}
              label="Мастеров"
              color={colors.success}
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <StatCard
              number={stats.totalSupervisors}
              label="Супервайзеров"
              color={colors.adminPurple}
              onPress={() => navigation.navigate('AdminUsers')}
            />
          </View>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Управление</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.route}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.actionCardPressed,
              ]}
              onPress={() => {
                hapticLight();
                navigation.navigate(action.route);
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </Pressable>
          ))}
        </View>

        {/* Summary cards */}
        <Text style={styles.sectionTitle}>Сводка</Text>
        <Card style={styles.summaryCard}>
          <SummaryRow label="Всего проектов" value={stats.totalProjects} />
          <SummaryRow label="Завершённых" value={stats.completedProjects} />
          <SummaryRow label="Клиентов" value={stats.totalClients} />
          <SummaryRow label="Лидов с лендинга" value={stats.totalLeads} />
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

function StatCard({
  number,
  label,
  color,
  onPress,
}: {
  number: number;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statCard,
        pressed && styles.statCardPressed,
      ]}
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
    >
      <Text style={[styles.statNumber, { color }]}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(123, 45, 62, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPressed: {
    opacity: 0.85,
  },
  statNumber: {
    ...typography.h1,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: spacing.md,
    shadowColor: 'rgba(123, 45, 62, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardPressed: {
    opacity: 0.85,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
  },
  summaryCard: {
    marginBottom: spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textLight,
  },
  summaryValue: {
    ...typography.bodyBold,
    color: colors.heading,
  },
});
