import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, AppDialog, SystemButton, Toggle } from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess } from '../../utils/haptics';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { UserRole } from '../../types';
import { useAdminStore, type AdminUser } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  toggleUserActive,
  updateUserRole,
  updateMasterVerification,
} from '../../services/projectService';

import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';

const ADMIN_PURPLE = '#7C3AED';

const ROLE_LABELS: Record<string, string> = {
  client: 'Клиент',
  master: 'Мастер',
  supervisor: 'Супервайзер',
  admin: 'Администратор',
};

export function AdminUserDetailScreen({ route, navigation }: any) {
  const { colors, glass, isDark } = useTheme();
  const styles = useAdminUserDetailStyles(colors, glass, isDark);

  const ROLE_COLORS: Record<string, string> = useMemo(() => ({
    client: colors.primary,
    master: colors.success,
    supervisor: colors.gold,
    admin: ADMIN_PURPLE,
  }), [colors]);

  const { userId } = route.params;
  const currentUser = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isDev = currentUser?.id.startsWith('dev-');

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const showDialog = (title: string, message: string, buttons: DialogButton[]) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogVisible(true);
  };

  useEffect(() => {
    const storeUser = useAdminStore.getState().users.find((u) => u.id === userId);
    if (storeUser) {
      setUser(storeUser);
    }
    setLoading(false);
  }, [userId]);

  const handleToggleActive = async () => {
    if (!user) return;
    const newActive = !user.is_active;
    try {
      if (!isDev) await toggleUserActive(user.id, newActive);
      const updated = { ...user, is_active: newActive };
      setUser(updated);
      useAdminStore.getState().setUsers(
        useAdminStore.getState().users.map((u) =>
          u.id === user.id ? updated : u,
        ),
      );
      hapticSuccess();
      showToast(newActive ? 'Активирован' : 'Заблокирован', newActive ? 'success' : 'info');
    } catch {
      showToast('Ошибка', 'error');
    }
  };

  const handleChangeRole = () => {
    if (!user) return;
    const roles: UserRole[] = ['client', 'master', 'supervisor', 'admin'];
    const buttons: DialogButton[] = roles
      .filter((r) => r !== user.role)
      .map((role) => ({
        text: ROLE_LABELS[role],
        onPress: async () => {
          try {
            if (!isDev) await updateUserRole(user.id, role);
            const updated = { ...user, role };
            setUser(updated);
            useAdminStore.getState().setUsers(
              useAdminStore.getState().users.map((u) =>
                u.id === user.id ? updated : u,
              ),
            );
            hapticSuccess();
            showToast(`Роль изменена: ${ROLE_LABELS[role]}`, 'success');
          } catch {
            showToast('Ошибка', 'error');
          }
        },
      }));
    buttons.push({ text: 'Отмена', style: 'cancel', onPress: () => {} });
    showDialog('Изменить роль', `Текущая: ${ROLE_LABELS[user.role]}`, buttons);
  };

  const handleToggleVerification = async () => {
    if (!user) return;
    const newVerified = !user.is_verified;
    try {
      if (!isDev) await updateMasterVerification(user.id, newVerified);
      const updated = { ...user, is_verified: newVerified };
      setUser(updated);
      useAdminStore.getState().setUsers(
        useAdminStore.getState().users.map((u) =>
          u.id === user.id ? updated : u,
        ),
      );
      hapticSuccess();
      showToast(
        newVerified ? 'Мастер верифицирован' : 'Верификация снята',
        newVerified ? 'success' : 'info',
      );
    } catch {
      showToast('Ошибка', 'error');
    }
  };

  if (loading || !user) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const roleColor = ROLE_COLORS[user.role];

  const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.backRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: `${roleColor}15` }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}15` }]}>
            <Text style={[styles.roleBadgeText, { color: roleColor }]}>
              {ROLE_LABELS[user.role]}
            </Text>
          </View>
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Контакты</Text>
          <InfoRow icon="call-outline" label="Телефон" value={user.phone} />
          {user.email && <InfoRow icon="mail-outline" label="Email" value={user.email} />}
          {user.city && <InfoRow icon="location-outline" label="Город" value={user.city} />}
          <InfoRow
            icon="calendar-outline"
            label="Регистрация"
            value={new Date(user.created_at).toLocaleDateString('ru-RU')}
          />
        </Card>

        {user.role === 'master' && (
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Мастер</Text>
            {user.specializations && user.specializations.length > 0 && (
              <InfoRow
                icon="construct-outline"
                label="Специализации"
                value={user.specializations.join(', ')}
              />
            )}
            {user.rating !== undefined && (
              <InfoRow
                icon="star-outline"
                label="Рейтинг"
                value={`${user.rating.toFixed(1)} (${user.reviews_count || 0} отзывов)`}
              />
            )}
            <View style={styles.verifyRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.verifyLabel}>Верификация</Text>
              <Toggle
                value={user.is_verified || false}
                onValueChange={handleToggleVerification}
              />
            </View>
          </Card>
        )}

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Статус</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Активен</Text>
            <Toggle
              value={user.is_active}
              onValueChange={handleToggleActive}
            />
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Изменить роль"
            onPress={handleChangeRole}
            variant="outline"
            fullWidth
            icon={<Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />}
          />
        </View>
      </ScrollView>

      <AppDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </ScreenWrapper>
  );
}

function useAdminUserDetailStyles(colors: ThemeColors, _glass: GlassTokens, _isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    container: {
      paddingBottom: 24,
    },
    backRow: {
      flexDirection: 'row',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
    },
    name: {
      ...typography.h2,
      color: colors.heading,
      marginBottom: spacing.sm,
    },
    roleBadge: {
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleBadgeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    infoCard: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyBold,
      color: colors.heading,
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    infoLabel: {
      ...typography.small,
      color: colors.textLight,
      width: 100,
    },
    infoValue: {
      ...typography.body,
      color: colors.heading,
      flex: 1,
    },
    verifyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    verifyLabel: {
      ...typography.body,
      color: colors.heading,
      flex: 1,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusLabel: {
      ...typography.body,
      color: colors.heading,
    },
    actions: {
      gap: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.xxl,
    },
  }), [colors]);
}
