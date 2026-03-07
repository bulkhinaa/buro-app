import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, CellIndicator } from '../components';
import { colors, spacing, typography } from '../theme';
import { useAuthStore } from '../store/authStore';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const roleLabel = {
    client: 'Клиент',
    master: 'Мастер',
    supervisor: 'Супервайзер',
    admin: 'Администратор',
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name || 'Имя не указано'}</Text>
        <Text style={styles.role}>{roleLabel[user?.role || 'client']}</Text>
        {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
      </View>

      <View style={styles.menuCard}>
        <CellIndicator
          variant="card"
          icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
          name="Редактировать профиль"
          showChevron
          onPress={() => {}}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="notifications-outline" size={20} color={colors.primary} />}
          name="Уведомления"
          showChevron
          onPress={() => {}}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="clipboard-outline" size={20} color={colors.primary} />}
          name="Мои отзывы"
          showChevron
          onPress={() => {}}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="chatbubble-outline" size={20} color={colors.primary} />}
          name="Поддержка"
          showChevron
          onPress={() => {}}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="document-outline" size={20} color={colors.primary} />}
          name="Документы"
          showChevron
          onPress={() => {}}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
          name="О приложении"
          showChevron
          onPress={() => {}}
        />
      </View>

      <Button
        title="Выйти из аккаунта"
        onPress={logout}
        variant="outline"
        fullWidth
        style={{ marginTop: spacing.xxl }}
      />

      <Text style={styles.version}>Версия 1.0.0</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  name: {
    ...typography.h2,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  role: {
    ...typography.body,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  phone: {
    ...typography.body,
    color: colors.textLight,
  },
  menuCard: {
    marginBottom: spacing.md,
  },
  // menuIcon style removed — now using Ionicons
  version: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
});
