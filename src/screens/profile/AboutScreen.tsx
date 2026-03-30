import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, CellIndicator } from '../../components';
import { spacing, radius, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';

export function AboutScreen() {
  const { colors, glass, isDark } = useTheme();
  const styles = useAboutStyles(colors, glass, isDark);

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* App identity */}
        <View style={styles.identitySection}>
          <View style={styles.logoCircle}>
            <Ionicons name="home" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>Бюро ремонтов</Text>
          <Text style={styles.appVersion}>Версия 1.0.0 (сборка 1)</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            Платформа для управления ремонтом с независимым контролем качества.
            Объединяем клиентов, мастеров и супервайзеров для прозрачного и
            качественного ремонта.
          </Text>
        </View>

        {/* Links */}
        <View style={styles.linksCard}>
          <CellIndicator
            variant="card"
            icon={<Ionicons name="globe-outline" size={20} color={colors.primary} />}
            name="Сайт"
            value="buroremontov.ru"
            showChevron
            onPress={() => Linking.openURL('https://buroremontov.ru')}
          />
          <CellIndicator
            variant="card"
            icon={<Ionicons name="star-outline" size={20} color={colors.primary} />}
            name="Оценить приложение"
            showChevron
            onPress={() => {
              // In production: deep-link to App Store / Google Play
            }}
          />
          <CellIndicator
            variant="card"
            icon={<Ionicons name="share-outline" size={20} color={colors.primary} />}
            name="Поделиться"
            showChevron
            onPress={() => {
              // In production: Share API
            }}
          />
        </View>

        {/* Legal */}
        <Text style={styles.legalText}>
          {'\u00A9'} 2026 Бюро ремонтов. Все права защищены.
        </Text>
        <Text style={styles.legalText}>ООО «Бюро ремонтов»</Text>
        <Text style={styles.legalText}>ИНН: в процессе регистрации</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function useAboutStyles(colors: ThemeColors, glass: GlassTokens, _isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    content: {
      paddingTop: spacing.sm,
    },
    identitySection: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: glass.fill.light,
      borderWidth: 1,
      borderColor: glass.border.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      ...glass.shadow,
    },
    appName: {
      ...typography.h1,
      color: colors.heading,
      marginBottom: spacing.xs,
    },
    appVersion: {
      ...typography.small,
      color: colors.textLight,
    },
    descriptionCard: {
      backgroundColor: glass.fill.light,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: glass.border.light,
      padding: spacing.xl,
      marginBottom: spacing.xxl,
      ...glass.shadow,
    },
    description: {
      ...typography.body,
      color: colors.text,
      lineHeight: 22,
      textAlign: 'center',
    },
    linksCard: {
      backgroundColor: glass.fill.light,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: glass.border.light,
      padding: spacing.xs,
      marginBottom: spacing.xxl,
      ...glass.shadow,
    },
    legalText: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: 4,
    },
  }), [colors, glass, _isDark]);
}
