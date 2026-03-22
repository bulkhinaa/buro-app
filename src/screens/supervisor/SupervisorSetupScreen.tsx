import React, { useState } from 'react';
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
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { hapticSuccess } from '../../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

export function SupervisorSetupScreen({ onComplete }: Props) {
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.show);
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

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec],
    );
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!experience) {
        showToast('Выберите опыт работы', 'error');
        return;
      }
      if (selectedSpecs.length === 0) {
        showToast('Выберите хотя бы одну специализацию', 'error');
        return;
      }
    }
    if (step === 2) {
      if (selectedRegions.length === 0) {
        showToast('Выберите хотя бы один регион', 'error');
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
    setLoading(true);
    try {
      await AsyncStorage.setItem(SUPERVISOR_SETUP_KEY, 'true');
      // TODO: save supervisor profile data to Supabase for real users
      hapticSuccess();
      showToast('Профиль супервайзера настроен', 'success');
      onComplete();
    } catch {
      showToast('Ошибка сохранения', 'error');
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
            <View style={styles.chipRow}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={experience === opt.value}
                  onPress={() => setExperience(opt.value)}
                />
              ))}
            </View>

            <Text style={styles.label}>Специализация</Text>
            <View style={styles.chipRow}>
              {SPECIALIZATIONS.map((spec) => (
                <Chip
                  key={spec}
                  label={spec}
                  selected={selectedSpecs.includes(spec)}
                  onPress={() => toggleSpec(spec)}
                />
              ))}
            </View>
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Регион работы</Text>
            <Text style={styles.stepSubtitle}>
              Где вы готовы осуществлять надзор
            </Text>

            <View style={styles.chipRow}>
              {REGIONS.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  selected={selectedRegions.includes(region)}
                  onPress={() => toggleRegion(region)}
                />
              ))}
            </View>

            <Text style={styles.label}>Адрес (необязательно)</Text>
            <Input
              placeholder="Ваш адрес для расчёта расстояний"
              value={address}
              onChangeText={setAddress}
            />
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
        >
          {renderStep()}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[styles.bottomRow, { paddingBottom: insets.bottom + spacing.md }]}>
          {step > 1 && (
            <Button
              title="Назад"
              onPress={handleBack}
              variant="outline"
              style={{ flex: 1 }}
            />
          )}
          <Button
            title={step === TOTAL_STEPS ? 'Завершить' : 'Далее'}
            onPress={handleNext}
            loading={loading}
            style={{ flex: step > 1 ? 1 : undefined }}
            fullWidth={step === 1}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.06)',
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
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
});
