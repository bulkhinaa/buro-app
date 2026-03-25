import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, Button } from '../components';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useLanguageStore, LANGUAGES, type LanguageInfo } from '../store/languageStore';
import { hapticSuccess } from '../utils/haptics';
import type { SupportedLanguage } from '../types';
import { trackTap } from '../services/analyticsService';

type Props = {
  onComplete?: () => void;
};

/** Bilingual confirm labels so every user understands the button */
const CONFIRM_LABELS: Record<SupportedLanguage, string> = {
  ru: 'Продолжить',
  uz: 'Davom etish',
  tg: 'Идома додан',
  ky: 'Улантуу',
  kk: 'Жалғастыру',
  hy: 'Շարունակել',
  ro: 'Continuă',
};

export function LanguageSelectScreen({ onComplete }: Props) {
  const { colors, glass, isDark } = useTheme();
  const { language: currentLang, setLanguage } = useLanguageStore();
  const navigation = useNavigation();

  const isFirstTime = !!onComplete;
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLang);
  const [loading, setLoading] = useState(false);

  const handleCardPress = async (lang: SupportedLanguage) => {
    if (isFirstTime) {
      setSelectedLang(lang);
    } else {
      await setLanguage(lang);
      hapticSuccess();
      navigation.goBack();
    }
  };

  const handleConfirm = async () => {
    trackTap('LanguageSelect', 'continue', { language: selectedLang });
    setLoading(true);
    await setLanguage(selectedLang);
    hapticSuccess();
    setLoading(false);
    onComplete!();
  };

  const displayLang = isFirstTime ? selectedLang : currentLang;

  const renderItem = ({ item }: { item: LanguageInfo }) => {
    const isSelected = item.code === displayLang;
    return (
      <Pressable
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
        onPress={() => handleCardPress(item.code)}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <Text style={[styles.langName, { color: colors.heading }, isSelected && { color: colors.primary }]}>
          {item.name}
        </Text>
        {isSelected && (
          <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.globeEmoji}>🌍</Text>
          <Text style={[styles.title, { color: colors.heading }]}>Выберите язык</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>Choose your language</Text>
        </View>

        <FlatList
          data={LANGUAGES}
          renderItem={renderItem}
          keyExtractor={(item) => item.code}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />

        {isFirstTime && (
          <View style={styles.bottomButton}>
            <Button
              title={CONFIRM_LABELS[selectedLang]}
              onPress={handleConfirm}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        )}
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
  globeEmoji: {
    fontSize: 48,
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
  grid: {
    paddingBottom: spacing.lg,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  flag: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  langName: {
    ...typography.bodyBold,
    textAlign: 'center',
  },
  checkCircle: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomButton: {
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
});
