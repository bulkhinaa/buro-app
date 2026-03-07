import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Input,
  Card,
  Button,
  AddressInput,
  ProgressBar,
  TextArea,
  AppDialog,
} from '../../components';
import type { DialogButton } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { RepairType } from '../../types';
import {
  estimateCost,
  estimateTimelineDays,
  formatRubles,
  formatTimeline,
  REPAIR_RATES,
} from '../../utils/calculator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const REPAIR_TYPES: RepairType[] = ['cosmetic', 'standard', 'premium', 'design'];

export function CreateProjectScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { submitProject, isLoading } = useProjectStore();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [areaText, setAreaText] = useState('');
  const [repairType, setRepairType] = useState<RepairType>('standard');
  const [comment, setComment] = useState('');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const areaSqm = parseFloat(areaText) || 0;

  const estimate = useMemo(() => {
    if (areaSqm <= 0) return null;
    const cost = estimateCost(repairType, areaSqm);
    const days = estimateTimelineDays(repairType, areaSqm);
    return { cost, days };
  }, [repairType, areaSqm]);

  const canGoStep2 = address.trim().length > 0 && areaSqm > 0;
  const canSubmit = canGoStep2;

  const handleNext = () => {
    if (canGoStep2) {
      Keyboard.dismiss();
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    Keyboard.dismiss();

    try {
      const title = `Ремонт: ${address.trim()}`;
      const project = await submitProject({
        clientId: user.id,
        title,
        address: address.trim(),
        areaSqm,
        repairType,
      });
      setDialogTitle('Проект создан!');
      setDialogMessage(
        'Мы уже ищем для вас супервайзера. Обычно это занимает до 24 часов. Вы получите уведомление.',
      );
      setDialogButtons([
        {
          text: 'Перейти к проекту',
          onPress: () => {
            setDialogVisible(false);
            navigation.replace('ProjectDetail', {
              projectId: project.id,
              project,
            });
          },
        },
      ]);
      setDialogVisible(true);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось создать проект');
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <ProgressBar progress={step === 1 ? 0.5 : 1} />
          <Text style={styles.stepText}>Шаг {step} из 2</Text>
        </View>

        {step === 1 ? (
          /* ===== STEP 1: Object info ===== */
          <>
            <Text style={styles.heading}>Расскажите об объекте</Text>
            <Text style={styles.subtitle}>
              Чем точнее данные, тем точнее расчёт
            </Text>

            <AddressInput
              placeholder="Город, улица, дом, квартира"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              placeholder="Площадь в м²"
              value={areaText}
              onChangeText={setAreaText}
              keyboardType="numeric"
            />

            <Button
              title="Далее →"
              onPress={handleNext}
              disabled={!canGoStep2}
              fullWidth
              style={{ marginTop: spacing.xxl }}
            />
          </>
        ) : (
          /* ===== STEP 2: Repair type ===== */
          <>
            <Text style={styles.heading}>Выберите тип ремонта</Text>
            <Text style={styles.subtitle}>
              Мы рассчитаем примерную стоимость и сроки
            </Text>

            <View style={styles.typeGrid}>
              {REPAIR_TYPES.map((type) => {
                const config = REPAIR_RATES[type];
                const isSelected = repairType === type;
                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeCard,
                      isSelected && styles.typeCardSelected,
                    ]}
                    onPress={() => setRepairType(type)}
                  >
                    <Ionicons
                      name={config.icon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={isSelected ? colors.primary : colors.textLight}
                      style={{ marginBottom: spacing.sm }}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        isSelected && styles.typeLabelSelected,
                      ]}
                    >
                      {config.label}
                    </Text>
                    <Text style={styles.typeRate}>
                      от {(config.rateMin / 1000).toFixed(0)}т ₽/м²
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {estimate && (
              <Card style={styles.estimateCard}>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Стоимость</Text>
                  <Text style={styles.estimateValue}>
                    {formatRubles(estimate.cost.min)} –{' '}
                    {formatRubles(estimate.cost.max)}
                  </Text>
                </View>
                <View style={styles.estimateDivider} />
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Сроки</Text>
                  <Text style={styles.estimateValueAccent}>
                    {formatTimeline(estimate.days)}
                  </Text>
                </View>
                <View style={styles.estimateDivider} />
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Этапы</Text>
                  <Text style={styles.estimateValue}>14 этапов</Text>
                </View>
              </Card>
            )}

            <TextArea
              placeholder="Пожелания или комментарий к ремонту (необязательно)"
              value={comment}
              onChangeText={setComment}
            />

            <View style={styles.step2Buttons}>
              <Button
                title="← Назад"
                onPress={() => setStep(1)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title={isLoading ? 'Создаём...' : 'Создать проект'}
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={isLoading}
                style={{ flex: 2 }}
              />
            </View>

            <Text style={styles.disclaimer}>
              * Расчёт приблизительный. Точную смету составит супервайзер после
              осмотра объекта.
            </Text>
          </>
        )}
      </KeyboardAvoidingView>

      <AppDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  stepText: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  heading: {
    ...typography.h1,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  typeCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  // typeIcon style removed — now using Ionicons inline
  typeLabel: {
    ...typography.smallBold,
    color: colors.heading,
    marginBottom: 2,
  },
  typeLabelSelected: {
    color: colors.primary,
  },
  typeRate: {
    ...typography.caption,
    color: colors.textLight,
  },
  estimateCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    marginBottom: spacing.xxl,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  estimateDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  estimateLabel: {
    ...typography.body,
    color: colors.textLight,
  },
  estimateValue: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  estimateValueAccent: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  step2Buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  disclaimer: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    lineHeight: 18,
  },
});
