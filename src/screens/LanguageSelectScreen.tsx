import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../components';
import { colors, spacing, radius, typography } from '../theme';
import { useLanguageStore, LANGUAGES, type LanguageInfo } from '../store/languageStore';
import { hapticSuccess } from '../utils/haptics';
import type { SupportedLanguage } from '../types';

type Props = {
  onComplete?: () => void;
};

export function LanguageSelectScreen({ onComplete }: Props) {
  const { language: currentLang, setLanguage } = useLanguageStore();
  const navigation = useNavigation();

  const handleSelect = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    hapticSuccess();
    if (onComplete) {
      onComplete();
    } else {
      // Navigated from Profile — go back
      navigation.goBack();
    }
  };

  const renderItem = ({ item }: { item: LanguageInfo }) => {
    const isSelected = item.code === currentLang;
    return (
      <Pressable
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleSelect(item.code)}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
          {item.name}
        </Text>
        {isSelected && (
          <View style={styles.checkCircle}>
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
          {/* Bilingual title — so everyone can understand */}
          <Text style={styles.title}>Выберите язык</Text>
          <Text style={styles.subtitle}>Choose your language</Text>
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
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  grid: {
    paddingBottom: spacing.huge,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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
  flag: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  langName: {
    ...typography.bodyBold,
    color: colors.heading,
    textAlign: 'center',
  },
  langNameSelected: {
    color: colors.primary,
  },
  checkCircle: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
