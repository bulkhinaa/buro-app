import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScreenWrapper,
  Button,
  Input,
  Chip,
  ProgressBar,
  AddressInput,
} from '../../components';
import { spacing, radius, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useSupervisorStore } from '../../store/supervisorStore';
import { hapticSuccess } from '../../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackForm } from '../../services/analyticsService';

import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';

export const SUPERVISOR_SETUP_KEY = 'supervisor_setup_complete';

const EXPERIENCE_OPTIONS = [
  { value: 'less_3', label: 'Менее 3 лет' },
  { value: '3_5', label: '3–5 лет' },
  { value: '5_10', label: '5–10 лет' },
  { value: 'more_10', label: 'Более 10 лет' },
];

const SPECIALIZATIONS = [
  'Жилые квартиры',
  'Загородные дома',
  'Коммерческие помещения',
  'Дизайнерский ремонт',
  'Новостройки',
  'Вторичное жильё',
];

const REGIONS = [
  'Москва',
  'Московская область',
  'Санкт-Петербург',
  'Ленинградская область',
];

const TOTAL_STEPS = 3;

type Props = {
  onComplete: () => void;
  onBack?: () => void;
};

export function SupervisorSetupScreen({ onComplete, onBack }: Props) {
  const { colors, glass, isDark } = useTheme();
  const styles = useSupervisorSetupStyles(colors, glass, isDark);
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.show);
  const saveSetupData = useSupervisorStore((s) => s.saveSetupData);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Experience
  const [experience, setExperience] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  // Step 2: Region
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [address, setAddress] = useState('');

  // Step 3: About
  const [about, setAbout] = useState('');

  // Validation error highlight states
  const [experienceError, setExperienceError] = useState<boolean>(false);
  const [specsError, setSpecsError] = useState<boolean>(false);
  const [regionsError, setRegionsError] = useState<boolean>(false);

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) => {
      const next = prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec];
      if (next.length > 0) setSpecsError(false);
      return next;
    });
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      const next = prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region];
      if (next.length > 0) setRegionsError(false);
      return next;
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!experience) {
        showToast('Выберите опыт работы', 'error');
        setExperienceError(true);
        return;
      }
      if (selectedSpecs.length === 0) {
        showToast('Выберите хотя бы одну специализацию', 'error');
        setSpecsError(true);
        return;
      }
    }
    if (step === 2) {
      if (selectedRegions.length === 0) {
        showToast('Выберите хотя бы один регион', 'error');
        setRegionsError(true);
        return;
      }
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await AsyncStorage.setItem(SUPERVISOR_SETUP_KEY, 'true');

      if (!user.id.startsWith('dev-')) {
        await saveSetupData(user.id, {
          experience,
          specializations: selectedSpecs,
          regions: selectedRegions,
          address,
          about,
        });
      }

      trackForm('SupervisorSetup', 'complete');
      hapticSuccess();
      showToast('Профиль супервайзера настроен', 'success');
      onComplete();
    } catch {
      showToast('Ошибка сохранения профиля. Попробуйте ещё раз', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Ваш опыт</Text>
            <Text style={styles.stepSubtitle}>
              Расскажите о своём опыте в строительном надзоре
            </Text>

            <Text style={styles.label}>Стаж работы</Text>
            <View style={[styles.chipRow, experienceError && styles.chipGroupError]}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={experience === opt.value}
                  onPress={() => { setExperience(opt.value); setExperienceError(false); }}
                />
              ))}
            </View>
            {experienceError && (
              <Text style={styles.chipErrorText}>Выберите опыт работы</Text>
            )}

            <Text style={styles.label}>Специализация</Text>
            <View style={[styles.chipRow, specsError && styles.chipGroupError]}>
              {SPECIALIZATIONS.map((spec) => (
                <Chip
                  key={spec}
                  label={spec}
                  selected={selectedSpecs.includes(spec)}
                  onPress={() => toggleSpec(spec)}
                />
              ))}
            </View>
            {specsError && (
              <Text style={styles.chipErrorText}>Выберите хотя бы одну специализацию</Text>
            )}
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Регион работы</Text>
            <Text style={styles.stepSubtitle}>
              Где вы готовы осуществлять надзор
            </Text>

            <View style={[styles.chipRow, regionsError && styles.chipGroupError]}>
              {REGIONS.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  selected={selectedRegions.includes(region)}
                  onPress={() => toggleRegion(region)}
                />
              ))}
            </View>
            {regionsError && (
              <Text style={styles.chipErrorText}>Выберите хотя бы один регион</Text>
            )}

            <AddressInput
              label="Адрес офиса или базы"
              showLabel={true}
              placeholder="Начните вводить адрес"
              value={address}
              onChangeText={setAddress}
            />
            <Text style={styles.hintText}>
              Клиенты и мастера увидят ваш район, не точный адрес
            </Text>
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>О себе</Text>
            <Text style={styles.stepSubtitle}>
              Краткое описание поможет клиентам выбрать вас
            </Text>

            <Input
              label="О себе"
              showLabel={true}
              placeholder="Расскажите о своём подходе к работе..."
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={4}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />

            <View style={styles.summaryCard}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>Всё готово!</Text>
                <Text style={styles.summarySubtitle}>
                  После сохранения вы сможете принимать проекты
                </Text>
              </View>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Шаг {step} из {TOTAL_STEPS}
          </Text>
          <ProgressBar progress={step / TOTAL_STEPS} height={4} />
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[styles.bottomRow, { paddingBottom: insets.bottom + spacing.md }]}>
          {step > 1 ? (
            <Button
              title="Назад"
              onPress={handleBack}
              variant="outline"
              style={{ flex: 1 }}
            />
          ) : onBack ? (
            <Button
              title="Назад"
              onPress={onBack}
              variant="outline"
              style={{ flex: 1 }}
            />
          ) : null}
          <Button
            title={step === TOTAL_STEPS ? 'Завершить' : 'Далее'}
            onPress={handleNext}
            loading={loading}
            style={{ flex: (step > 1 || onBack) ? 1 : undefined }}
            fullWidth={step === 1 && !onBack}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

function useSupervisorSetupStyles(colors: ThemeColors, _glass: GlassTokens, isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    progressRow: {
      gap: spacing.xs,
      marginBottom: spacing.xxl,
    },
    progressText: {
      ...typography.caption,
      color: colors.textLight,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
    stepTitle: {
      ...typography.h1,
      color: colors.heading,
      marginBottom: spacing.xs,
    },
    stepSubtitle: {
      ...typography.body,
      color: colors.textLight,
      lineHeight: 22,
      marginBottom: spacing.xxl,
    },
    label: {
      ...typography.bodyBold,
      color: colors.heading,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chipGroupError: {
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: radius.lg,
      padding: spacing.sm,
    },
    chipErrorText: {
      ...typography.small,
      color: colors.danger,
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(62,220,132,0.06)' : 'rgba(52, 199, 89, 0.06)',
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      marginTop: spacing.xxl,
      alignItems: 'center',
    },
    summaryText: {
      flex: 1,
    },
    summaryTitle: {
      ...typography.bodyBold,
      color: colors.heading,
      marginBottom: 2,
    },
    summarySubtitle: {
      ...typography.small,
      color: colors.textLight,
    },
    hintText: {
      fontSize: 12,
      marginTop: 4,
      color: colors.textLight,
    },
    bottomRow: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingTop: spacing.md,
    },
  }), [colors, isDark]);
}
