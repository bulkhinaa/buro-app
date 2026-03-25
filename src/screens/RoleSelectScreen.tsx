import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button } from '../components';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
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
    title: 'Хочу сделать ремонт',
    subtitle: 'Найду мастеров, буду следить за ходом работ',
  },
  {
    key: 'master',
    icon: 'hammer-outline',
    title: 'Ищу заказы на ремонт',
    subtitle: 'Получу задачи, покажу портфолио, заработаю',
  },
  {
    key: 'supervisor',
    icon: 'eye-outline',
    title: 'Контролирую качество',
    subtitle: 'Проверяю работы мастеров, защищаю интересы клиентов',
  },
];

type Props = {
  onComplete: () => void;
};

export function RoleSelectScreen({ onComplete }: Props) {
  const { colors, glass, isDark } = useTheme();
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
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="people" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.heading }]}>Что привело вас к нам?</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Выберите, и мы настроим приложение под вас
          </Text>
        </View>

        <View style={styles.cards}>
          {ROLES.map((role) => {
            const isSelected = selected === role.key;
            return (
              <Pressable
                key={role.key}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? glass.fill.regular : 'rgba(255, 255, 255, 0.65)',
                    borderColor: isDark ? glass.border.regular : 'rgba(255, 255, 255, 0.85)',
                    shadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0, 0, 0, 0.06)',
                  },
                  isSelected && {
                    borderColor: isDark ? colors.borderHover : 'rgba(123, 45, 62, 0.3)',
                    backgroundColor: isDark ? colors.primaryLight : 'rgba(123, 45, 62, 0.06)',
                  },
                ]}
                onPress={() => handleSelect(role.key)}
              >
                <View
                  style={[
                    styles.roleIcon,
                    { backgroundColor: colors.primaryLight },
                    isSelected && { backgroundColor: colors.primary },
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
                      { color: colors.heading },
                      isSelected && { color: colors.primary },
                    ]}
                  >
                    {role.title}
                  </Text>
                  <Text style={[styles.roleSubtitle, { color: colors.textLight }]}>{role.subtitle}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  cards: {
    gap: spacing.md,
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardText: {
    flex: 1,
  },
  roleTitle: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  roleSubtitle: {
    ...typography.small,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  bottomButton: {
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
});
