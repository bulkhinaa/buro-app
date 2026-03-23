import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button } from '../components';
import { colors, spacing, radius, typography } from '../theme';
import { hapticSuccess, hapticLight } from '../utils/haptics';
import { trackTap } from '../services/analyticsService';

export const SELECTED_ROLE_KEY = 'SELECTED_ROLE';

type RoleOption = {
  key: 'client' | 'master' | 'supervisor';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

const ROLES: RoleOption[] = [
  {
    key: 'client',
    icon: 'home-outline',
    title: 'Заказчик',
    subtitle: 'Хочу сделать ремонт',
  },
  {
    key: 'master',
    icon: 'hammer-outline',
    title: 'Мастер',
    subtitle: 'Выполняю ремонтные работы',
  },
  {
    key: 'supervisor',
    icon: 'eye-outline',
    title: 'Супервайзер',
    subtitle: 'Контролирую качество работ',
  },
];

type Props = {
  onComplete: () => void;
};

export function RoleSelectScreen({ onComplete }: Props) {
  const [selected, setSelected] = useState<RoleOption['key']>('client');
  const [loading, setLoading] = useState(false);

  const handleSelect = (key: RoleOption['key']) => {
    trackTap('RoleSelect', 'select_role', { role: key });
    setSelected(key);
    hapticLight();
  };

  const handleConfirm = async () => {
    trackTap('RoleSelect', 'confirm', { role: selected });
    setLoading(true);
    await AsyncStorage.setItem(SELECTED_ROLE_KEY, selected);
    hapticSuccess();
    setLoading(false);
    onComplete();
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Кто вы?</Text>
          <Text style={styles.subtitle}>
            Выберите вашу роль в платформе
          </Text>
        </View>

        <View style={styles.cards}>
          {ROLES.map((role) => {
            const isSelected = selected === role.key;
            return (
              <Pressable
                key={role.key}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(role.key)}
              >
                <View
                  style={[
                    styles.roleIcon,
                    isSelected && styles.roleIconSelected,
                  ]}
                >
                  <Ionicons
                    name={role.icon}
                    size={28}
                    color={isSelected ? colors.white : colors.primary}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text
                    style={[
                      styles.roleTitle,
                      isSelected && styles.roleTitleSelected,
                    ]}
                  >
                    {role.title}
                  </Text>
                  <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomButton}>
          <Button
            title="Продолжить"
            onPress={handleConfirm}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.huge,
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  cards: {
    gap: spacing.md,
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xl,
    // Glass shadow
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSelected: {
    borderColor: 'rgba(123, 45, 62, 0.3)',
    backgroundColor: 'rgba(123, 45, 62, 0.06)',
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  roleIconSelected: {
    backgroundColor: colors.primary,
  },
  cardText: {
    flex: 1,
  },
  roleTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  roleTitleSelected: {
    color: colors.primary,
  },
  roleSubtitle: {
    ...typography.small,
    color: colors.textLight,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  bottomButton: {
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
});
