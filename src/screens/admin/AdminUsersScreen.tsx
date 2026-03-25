import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, SearchInput, GlassChip, Toggle } from '../../components';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { colors, spacing, typography, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAdminStore, MOCK_USERS, type AdminUser, type UserFilter } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { fetchAllUsers, toggleUserActive } from '../../services/projectService';

const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'client', label: 'Клиенты' },
  { key: 'master', label: 'Мастера' },
  { key: 'supervisor', label: 'Супервайзеры' },
  { key: 'admin', label: 'Админы' },
];

const ROLE_COLORS: Record<string, string> = {
  client: colors.primary,
  master: colors.success,
  supervisor: colors.gold,
  admin: '#8B5CF6',
};

const ROLE_LABELS: Record<string, string> = {
  client: 'Клиент',
  master: 'Мастер',
  supervisor: 'Супервайзер',
  admin: 'Администратор',
};

export function AdminUsersScreen({ navigation }: any) {
  const { colors: themeColors, glass, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isDev = user?.id.startsWith('dev-');

  const allUsers = useAdminStore((s) => s.users);
  const filter = useAdminStore((s) => s.userFilter);
  const search = useAdminStore((s) => s.userSearch);

  const users = useMemo(() => {
    let filtered = allUsers;
    if (filter !== 'all') {
      filtered = filtered.filter((u) => u.role === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)),
      );
    }
    return filtered;
  }, [allUsers, filter, search]);
  const setUsers = useAdminStore((s) => s.setUsers);
  const setFilter = useAdminStore((s) => s.setUserFilter);
  const setSearch = useAdminStore((s) => s.setUserSearch);

  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDev) {
        setUsers(MOCK_USERS);
      } else {
        const data = await fetchAllUsers();
        setUsers(data as AdminUser[]);
      }
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, [isDev, setUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (targetUser: AdminUser) => {
    const newActive = !targetUser.is_active;
    try {
      if (!isDev) await toggleUserActive(targetUser.id, newActive);
      setUsers(
        useAdminStore.getState().users.map((u) =>
          u.id === targetUser.id ? { ...u, is_active: newActive } : u,
        ),
      );
      hapticSuccess();
      showToast(
        newActive ? `${targetUser.name} активирован` : `${targetUser.name} заблокирован`,
        newActive ? 'success' : 'info',
      );
    } catch {
      showToast('Ошибка', 'error');
    }
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <Pressable
      onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id })}
    >
      <Card style={[styles.card, !item.is_active && styles.cardInactive]}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: `${ROLE_COLORS[item.role]}15` }]}>
            <Text style={[styles.avatarText, { color: ROLE_COLORS[item.role] }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.is_verified && (
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              )}
            </View>
            <Text style={styles.cardPhone}>{item.phone}</Text>
            <View style={styles.roleRow}>
              <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLORS[item.role]}15` }]}>
                <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[item.role] }]}>
                  {ROLE_LABELS[item.role]}
                </Text>
              </View>
              {item.rating !== undefined && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={styles.ratingText}>
                    {item.rating.toFixed(1)} ({item.reviews_count || 0})
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Toggle */}
          <Toggle
            value={item.is_active}
            onValueChange={() => handleToggleActive(item)}
          />
        </View>
      </Card>
    </Pressable>
  );

  const roleCounts = allUsers.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Пользователи</Text>
        <Text style={styles.subtitle}>
          Всего: {allUsers.length}
        </Text>
      </View>

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Поиск по имени или телефону..."
      />

      <View style={styles.filters}>
        {FILTER_OPTIONS.map((opt) => {
          const count =
            opt.key === 'all'
              ? allUsers.length
              : roleCounts[opt.key] || 0;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                setFilter(opt.key);
                hapticLight();
              }}
            >
              <GlassChip
                label={`${opt.label}${count > 0 ? ` (${count})` : ''}`}
                active={filter === opt.key}
              />
            </Pressable>
          );
        })}
      </View>

      {users.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons
            name="people-outline"
            size={48}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <Text style={styles.emptyText}>Нет пользователей</Text>
        </Card>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: 2,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardName: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  cardPhone: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 1,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    ...typography.small,
    color: colors.textLight,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.heading,
  },
});
