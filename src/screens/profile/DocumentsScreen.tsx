import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, CellIndicator } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';

interface DocItem {
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  description: string;
  url: string;
}

const DOCUMENTS: DocItem[] = [
  {
    icon: 'document-text-outline',
    name: 'Пользовательское соглашение',
    description: 'Условия использования платформы',
    url: 'https://buroremontov.ru/terms',
  },
  {
    icon: 'shield-checkmark-outline',
    name: 'Политика конфиденциальности',
    description: 'Обработка персональных данных',
    url: 'https://buroremontov.ru/privacy',
  },
  {
    icon: 'briefcase-outline',
    name: 'Публичная оферта',
    description: 'Договор оказания услуг',
    url: 'https://buroremontov.ru/offer',
  },
  {
    icon: 'card-outline',
    name: 'Порядок оплаты',
    description: 'Условия и способы оплаты',
    url: 'https://buroremontov.ru/payment',
  },
  {
    icon: 'return-up-back-outline',
    name: 'Политика возврата',
    description: 'Условия возврата средств',
    url: 'https://buroremontov.ru/refund',
  },
];

export function DocumentsScreen() {
  const handleOpenDoc = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.subtitle}>
          Правовая информация и документы платформы
        </Text>

        <View style={styles.docsCard}>
          {DOCUMENTS.map((doc, i) => (
            <CellIndicator
              key={i}
              variant="card"
              icon={<Ionicons name={doc.icon} size={20} color={colors.primary} />}
              name={doc.name}
              showChevron
              onPress={() => handleOpenDoc(doc.url)}
            />
          ))}
        </View>

        {/* Info footer */}
        <View style={styles.infoBlock}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textLight}
          />
          <Text style={styles.infoText}>
            Используя приложение, вы соглашаетесь с условиями пользовательского
            соглашения и политикой конфиденциальности
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  docsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xs,
    marginBottom: spacing.xxl,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  infoText: {
    ...typography.small,
    color: colors.textLight,
    flex: 1,
    lineHeight: 18,
  },
});
