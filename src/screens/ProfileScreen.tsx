import React from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button, CellIndicator } from '../components';
import { colors, spacing, radius, typography } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, logout } = useAuthStore();

  const roleLabel = {
    client: 'Клиент',
    master: 'Мастер',
    supervisor: 'Супервайзер',
    admin: 'Администратор',
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: logout },
      ],
    );
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
        {user?.city ? <Text style={styles.city}>{user.city}</Text> : null}
        {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
      </View>

      <View style={styles.glassMenuCard}>
        <CellIndicator
          variant="card"
          icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
          name="Редактировать профиль"
          showChevron
          onPress={() => navigation.navigate('EditProfile')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="notifications-outline" size={20} color={colors.primary} />}
          name="Уведомления"
          showChevron
          onPress={() => navigation.navigate('NotificationsStack')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="clipboard-outline" size={20} color={colors.primary} />}
          name="Мои отзывы"
          showChevron
          onPress={() => navigation.navigate('MyReviews')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="chatbubble-outline" size={20} color={colors.primary} />}
          name="Поддержка"
          showChevron
          onPress={() => navigation.navigate('Support')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="document-outline" size={20} color={colors.primary} />}
          name="Документы"
          showChevron
          onPress={() => navigation.navigate('Documents')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
          name="О приложении"
          showChevron
          onPress={() => navigation.navigate('About')}
        />
      </View>

      <Button
        title="Выйти из аккаунта"
        onPress={handleLogout}
        variant="outline"
        fullWidth
        style={{ marginTop: spacing.xxl }}
      />

      <Text style={styles.version}>Версия 1.0.0</Text>
      <View style={{ height: 60 }} />
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
  city: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  phone: {
    ...typography.body,
    color: colors.textLight,
  },
  glassMenuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xs,
    marginBottom: spacing.md,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  version: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
});
