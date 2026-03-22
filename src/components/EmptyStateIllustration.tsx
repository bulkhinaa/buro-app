import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

type EmptyVariant =
  | 'no-projects'
  | 'no-tasks'
  | 'no-messages'
  | 'no-photos'
  | 'no-reviews'
  | 'no-notifications'
  | 'no-masters'
  | 'no-results';

const VARIANT_CONFIG: Record<EmptyVariant, {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}> = {
  'no-projects': {
    icon: 'home-outline',
    title: 'Пока нет проектов',
    subtitle: 'Создайте заявку, чтобы начать ремонт',
  },
  'no-tasks': {
    icon: 'clipboard-outline',
    title: 'Нет задач',
    subtitle: 'Здесь появятся назначенные этапы',
  },
  'no-messages': {
    icon: 'chatbubbles-outline',
    title: 'Нет сообщений',
    subtitle: 'Начните общение с командой проекта',
  },
  'no-photos': {
    icon: 'images-outline',
    title: 'Нет фотографий',
    subtitle: 'Фотоотчёты появятся здесь',
  },
  'no-reviews': {
    icon: 'star-outline',
    title: 'Нет отзывов',
    subtitle: 'Оставьте отзыв после завершения ремонта',
  },
  'no-notifications': {
    icon: 'notifications-outline',
    title: 'Нет уведомлений',
    subtitle: 'Вы в курсе всех событий',
  },
  'no-masters': {
    icon: 'people-outline',
    title: 'Нет мастеров',
    subtitle: 'Пригласите мастеров для работы',
  },
  'no-results': {
    icon: 'search-outline',
    title: 'Ничего не найдено',
    subtitle: 'Попробуйте изменить параметры поиска',
  },
};

interface EmptyStateIllustrationProps {
  variant: EmptyVariant;
  title?: string;
  subtitle?: string;
}

export function EmptyStateIllustration({
  variant,
  title,
  subtitle,
}: EmptyStateIllustrationProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={config.icon}
          size={40}
          color={colors.primary}
        />
      </View>
      <Text style={styles.title}>{title || config.title}</Text>
      <Text style={styles.subtitle}>{subtitle || config.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    maxWidth: 260,
  },
});
