import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, CellIndicator } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';

export function AboutScreen() {
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
            icon={<Ionicons name="paper-plane-outline" size={20} color={colors.primary} />}
            name="Telegram"
            showChevron
            onPress={() => Linking.openURL('https://t.me/buroremontov')}
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

        {/* Stats */}
        <Text style={styles.sectionTitle}>Платформа в цифрах</Text>
        <View style={styles.statsRow}>
          {[
            { num: '150+', label: 'проектов' },
            { num: '4.8', label: 'рейтинг' },
            { num: '98%', label: 'довольны' },
          ].map((stat) => (
            <View key={stat.num} style={styles.statBlock}>
              <Text style={styles.statNumber}>{stat.num}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Legal */}
        <Text style={styles.legalText}>
          {'\u00A9'} 2026 Бюро ремонтов. Все права защищены.
        </Text>
        <Text style={styles.legalText}>ИП Бульхин Артём Викторович</Text>
        <Text style={styles.legalText}>ИНН: 000000000000</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  description: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  linksCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xs,
    marginBottom: spacing.xxl,
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xxxl,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.xs,
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  legalText: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
});
