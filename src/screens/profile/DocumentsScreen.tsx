import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, CellIndicator } from '../../components';
import { spacing, radius, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';

const BASE_URL = 'https://bulkhinaa.github.io/buro-app';

interface DocItem {
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  title: string;
  uri: string;
}

const DOCUMENTS: DocItem[] = [
  {
    icon: 'document-text-outline',
    name: 'Пользовательское соглашение',
    title: 'Пользовательское соглашение',
    uri: `${BASE_URL}/terms.html`,
  },
  {
    icon: 'shield-checkmark-outline',
    name: 'Политика конфиденциальности',
    title: 'Политика конфиденциальности',
    uri: `${BASE_URL}/privacy.html`,
  },
  {
    icon: 'briefcase-outline',
    name: 'Публичная оферта',
    title: 'Публичная оферта',
    uri: `${BASE_URL}/offer.html`,
  },
  {
    icon: 'card-outline',
    name: 'Порядок оплаты',
    title: 'Порядок оплаты',
    uri: `${BASE_URL}/payment.html`,
  },
  {
    icon: 'return-up-back-outline',
    name: 'Политика возврата',
    title: 'Политика возврата',
    uri: `${BASE_URL}/refund.html`,
  },
];

export function DocumentsScreen() {
  const navigation = useNavigation<any>();
  const { colors, glass, isDark } = useTheme();
  const styles = useDocumentsStyles(colors, glass, isDark);

  const handleOpenDoc = (uri: string, title: string) => {
    navigation.navigate('DocumentViewer', { uri, title });
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
              onPress={() => handleOpenDoc(doc.uri, doc.title)}
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

function useDocumentsStyles(colors: ThemeColors, glass: GlassTokens, _isDark: boolean) {
  return useMemo(() => StyleSheet.create({
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
      backgroundColor: glass.fill.light,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: glass.border.light,
      padding: spacing.xs,
      marginBottom: spacing.xxl,
      ...glass.shadow,
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
  }), [colors, glass, _isDark]);
}
