import React, { useState, useMemo, useCallback } from 'react';
import { hapticSuccess } from '../../utils/haptics';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import type { DaDataSuggestion } from '../../components/AddressInput';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useToastStore } from '../../store/toastStore';
import { RepairType, RenovationScope } from '../../types';
import {
  estimateScopedCost,
  estimateScopedTimeline,
  formatRubles,
  formatTimeline,
  REPAIR_RATES,
} from '../../utils/calculator';
import { getStageCount } from '../../data/stageBreakdown';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

const REPAIR_TYPES: RepairType[] = ['cosmetic', 'standard', 'premium', 'design'];

// Room scopes for multi-select (excluding 'full' — handled separately)
const ROOM_SCOPES: {
  value: RenovationScope;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'kitchen', label: 'Кухня', icon: 'restaurant-outline' },
  { value: 'bathroom', label: 'Санузел', icon: 'water-outline' },
  { value: 'living_room', label: 'Гостиная', icon: 'tv-outline' },
  { value: 'bedroom', label: 'Спальня', icon: 'bed-outline' },
  { value: 'hallway', label: 'Прихожая', icon: 'enter-outline' },
  { value: 'balcony', label: 'Балкон', icon: 'sunny-outline' },
];

const ALL_ROOM_VALUES: RenovationScope[] = ROOM_SCOPES.map((s) => s.value);

export function CreateProjectScreen({ navigation, route }: Props) {
  const { user } = useAuthStore();
  const { submitProject, isLoading } = useProjectStore();
  const showToast = useToastStore((s) => s.show);
  const insets = useSafeAreaInsets();

  // Object context (if coming from ObjectDetail or AddObject)
  const objectId = route.params?.objectId as string | undefined;
  const objectAddress = route.params?.objectAddress as string | undefined;
  const objectArea = route.params?.objectArea as number | undefined;
  const hasObject = !!objectId;

  // Steps: from object = 2 (scope, type); standalone = 3 (address, scope, type)
  const TOTAL_STEPS = hasObject ? 2 : 3;
  const STEP_ADDRESS = hasObject ? -1 : 1; // -1 = doesn't exist
  const STEP_SCOPE = hasObject ? 1 : 2;
  const STEP_TYPE = hasObject ? 2 : 3;

  const [step, setStep] = useState(1);

  // Step: Address (standalone only)
  const [address, setAddress] = useState(objectAddress || '');
  const [addressValidated, setAddressValidated] = useState(!!objectAddress);
  const [addressTouched, setAddressTouched] = useState(false);
  const [areaText, setAreaText] = useState(
    objectArea ? String(objectArea) : '',
  );
  const [areaTouched, setAreaTouched] = useState(false);
  const [areaAutoFilled, setAreaAutoFilled] = useState(false);

  // Step: Scope
  const [selectedScopes, setSelectedScopes] = useState<RenovationScope[]>([]);
  const isFullSelected = selectedScopes.includes('full');

  // Step: Type
  const [repairType, setRepairType] = useState<RepairType>('standard');
  const [projectName, setProjectName] = useState('');
  const [comment, setComment] = useState('');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const areaSqm = parseFloat(areaText) || 0;

  const estimate = useMemo(() => {
    if (areaSqm <= 0) return null;
    const cost = estimateScopedCost(repairType, areaSqm, selectedScopes);
    const days = estimateScopedTimeline(repairType, areaSqm, selectedScopes);
    return { cost, days };
  }, [repairType, areaSqm, selectedScopes]);

  // --- Scope selection logic ---
  const handleToggleScope = useCallback(
    (scope: RenovationScope) => {
      if (scope === 'full') {
        // Toggle "Вся квартира"
        if (isFullSelected) {
          setSelectedScopes([]);
        } else {
          setSelectedScopes(['full', ...ALL_ROOM_VALUES]);
        }
        return;
      }

      setSelectedScopes((prev) => {
        let next: RenovationScope[];
        if (prev.includes(scope)) {
          // Remove this scope and 'full' if present
          next = prev.filter((s) => s !== scope && s !== 'full');
        } else {
          next = [...prev.filter((s) => s !== 'full'), scope];
          // If all rooms selected, also add 'full'
          const allRoomsNow = ALL_ROOM_VALUES.every((v) => next.includes(v));
          if (allRoomsNow) {
            next = ['full', ...ALL_ROOM_VALUES];
          }
        }
        return next;
      });
    },
    [isFullSelected],
  );

  // --- Validation ---
  const canProceedAddress =
    addressValidated && areaText.trim().length > 0 && areaSqm > 0;
  const canProceedScope = selectedScopes.length > 0;

  // Address error
  const addressError = useMemo(() => {
    if (!addressTouched) return undefined;
    if (!address.trim()) return 'Введите адрес';
    if (!addressValidated) return 'Выберите адрес с домом и квартирой';
    return undefined;
  }, [address, addressValidated, addressTouched]);

  // Area error
  const areaError = useMemo(() => {
    if (!areaTouched) return undefined;
    if (!areaText.trim()) return 'Укажите площадь';
    if (areaSqm <= 0) return 'Площадь должна быть больше 0';
    return undefined;
  }, [areaText, areaSqm, areaTouched]);

  // Auto-fill area from DaData suggestion (Maximum plan provides square data)
  const handleAddressSelected = useCallback((suggestion: DaDataSuggestion) => {
    if (suggestion.data.square && suggestion.data.square > 0) {
      setAreaText(String(Math.round(suggestion.data.square)));
      setAreaTouched(true);
      setAreaAutoFilled(true);
    } else {
      setAreaAutoFilled(false);
    }
  }, []);

  // --- Navigation ---
  const handleNext = useCallback(() => {
    if (step === STEP_ADDRESS) {
      if (!canProceedAddress) {
        setAddressTouched(true);
        setAreaTouched(true);
        if (!address.trim()) {
          showToast('Введите адрес объекта');
        } else if (!addressValidated) {
          showToast('Укажите полный адрес с домом и квартирой');
        } else {
          showToast('Укажите площадь объекта');
        }
        return;
      }
      Keyboard.dismiss();
    }

    if (step === STEP_SCOPE) {
      if (!canProceedScope) {
        showToast('Выберите помещения для ремонта');
        return;
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  }, [
    step,
    STEP_ADDRESS,
    STEP_SCOPE,
    TOTAL_STEPS,
    canProceedAddress,
    canProceedScope,
    address,
    addressValidated,
    showToast,
  ]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if (isLoading) return; // Prevent double submit
    Keyboard.dismiss();

    const finalAddress = hasObject ? (objectAddress || '') : address.trim();
    const finalArea = hasObject ? (objectArea || 0) : areaSqm;

    if (!finalAddress || finalArea <= 0) {
      showToast('Не удалось получить данные об объекте');
      return;
    }

    try {
      const title = projectName.trim() || `Ремонт: ${finalAddress}`;
      const project = await submitProject({
        clientId: user.id,
        title,
        address: finalAddress,
        areaSqm: finalArea,
        repairType,
        objectId,
        scope: selectedScopes.length > 0 ? selectedScopes : undefined,
      });
      setDialogTitle('Проект создан!');
      setDialogMessage(
        'Мы уже ищем для вас супервайзера. Обычно это занимает до 24 часов. Вы получите уведомление.',
      );
      setDialogButtons([
        {
          text: 'Перейти к проекту',
          onPress: () => {
            navigation.replace('ProjectDetail', {
              projectId: project.id,
              project,
            });
          },
        },
      ]);
      setDialogVisible(true);
      hapticSuccess();
    } catch (e: any) {
      showToast(e.message || 'Не удалось создать проект', 'error');
    }
  }, [
    user,
    isLoading,
    hasObject,
    objectAddress,
    objectArea,
    address,
    areaSqm,
    repairType,
    objectId,
    selectedScopes,
    submitProject,
    navigation,
    showToast,
  ]);

  // ─── Step renderers ───

  const renderAddressStep = () => (
    <>
      <Text style={styles.heading}>Расскажите об объекте</Text>
      <Text style={styles.subtitle}>
        Чем точнее данные, тем точнее расчёт
      </Text>

      <View style={styles.formSection}>
        <AddressInput
          placeholder="Город, улица, дом, квартира"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (text.length > 0) setAddressTouched(true);
          }}
          onValidated={setAddressValidated}
          onSuggestionSelected={handleAddressSelected}
          error={addressError}
        />

        <Input
          placeholder="Площадь в м²"
          value={areaText}
          onChangeText={(text) => {
            setAreaText(text);
            setAreaAutoFilled(false); // User override clears badge
            if (text.length > 0) setAreaTouched(true);
          }}
          keyboardType="numeric"
          leftIcon={
            <Ionicons name="resize-outline" size={18} color={colors.textLight} />
          }
          rightIcon={
            areaAutoFilled ? (
              <View style={styles.autofilledBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.autofilledText}>из реестра</Text>
              </View>
            ) : undefined
          }
          error={areaError}
        />
      </View>
    </>
  );

  const renderScopeStep = () => (
    <>
      <Text style={styles.heading}>Что ремонтируем?</Text>
      <Text style={styles.subtitle}>
        Выберите помещения для ремонта
      </Text>

      <View style={styles.scopeGrid}>
        {/* "Вся квартира" — full width */}
        <Pressable
          onPress={() => handleToggleScope('full')}
          style={[
            styles.scopeCardFull,
            isFullSelected && styles.scopeCardSelected,
          ]}
        >
          <View style={[styles.scopeIconCircle, isFullSelected && styles.scopeIconCircleSelected]}>
            <Ionicons
              name="home-outline"
              size={24}
              color={isFullSelected ? colors.primary : colors.textLight}
            />
          </View>
          <Text style={[styles.scopeLabel, isFullSelected && styles.scopeLabelSelected]}>
            Вся квартира
          </Text>
          {isFullSelected && (
            <View style={styles.scopeCheck}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </View>
          )}
        </Pressable>

        {/* Individual rooms — 2 columns */}
        {ROOM_SCOPES.map((room) => {
          const isSelected = selectedScopes.includes(room.value);
          return (
            <Pressable
              key={room.value}
              onPress={() => handleToggleScope(room.value)}
              style={[
                styles.scopeCard,
                isSelected && styles.scopeCardSelected,
              ]}
            >
              <View style={[styles.scopeIconCircle, isSelected && styles.scopeIconCircleSelected]}>
                <Ionicons
                  name={room.icon}
                  size={22}
                  color={isSelected ? colors.primary : colors.textLight}
                />
              </View>
              <Text style={[styles.scopeLabel, isSelected && styles.scopeLabelSelected]}>
                {room.label}
              </Text>
              {isSelected && (
                <View style={styles.scopeCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );

  const renderTypeStep = () => (
    <>
      <Text style={styles.heading}>Тип ремонта</Text>
      <Text style={styles.subtitle}>
        Мы рассчитаем примерную стоимость и сроки
      </Text>

      <Input
        placeholder="Название проекта (необязательно)"
        value={projectName}
        onChangeText={setProjectName}
        leftIcon={
          <Ionicons name="pencil-outline" size={18} color={colors.textLight} />
        }
        style={{ marginBottom: spacing.lg }}
      />

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
          {/* Show scope area if not full apartment */}
          {estimate.cost.scopeArea < areaSqm && (
            <>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Площадь ремонта</Text>
                <Text style={styles.estimateValue}>
                  ~{estimate.cost.scopeArea} м² из {areaSqm} м²
                </Text>
              </View>
              <View style={styles.estimateDivider} />
            </>
          )}
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Стоимость</Text>
            <Text style={styles.estimateValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatRubles(estimate.cost.min)} – {formatRubles(estimate.cost.max)}
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
            <Text style={styles.estimateValue}>
              {getStageCount(repairType)} этапов
            </Text>
          </View>
        </Card>
      )}

      <TextArea
        placeholder="Пожелания или комментарий к ремонту (необязательно)"
        value={comment}
        onChangeText={setComment}
      />

      <Text style={styles.disclaimer}>
        * Расчёт приблизительный. Точную смету составит супервайзер после
        осмотра объекта.
      </Text>
    </>
  );

  const renderCurrentStep = () => {
    if (step === STEP_ADDRESS) return renderAddressStep();
    if (step === STEP_SCOPE) return renderScopeStep();
    if (step === STEP_TYPE) return renderTypeStep();
    return null;
  };

  return (
    <ScreenWrapper scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Button
            title=""
            onPress={handleBack}
            variant="ghost"
            icon={<Ionicons name="arrow-back" size={22} color={colors.heading} />}
            style={styles.backButton}
          />
          <View style={styles.progressArea}>
            <Text style={styles.stepText}>Шаг {step} из {TOTAL_STEPS}</Text>
            <ProgressBar progress={step / TOTAL_STEPS} height={4} />
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Bottom buttons — always active */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {step < TOTAL_STEPS ? (
            <Button
              title="Далее →"
              onPress={handleNext}
              fullWidth
            />
          ) : (
            <View style={styles.submitRow}>
              <Button
                title="← Назад"
                onPress={handleBack}
                variant="outline"
                style={styles.backBtn}
              />
              <Button
                title={isLoading ? 'Создаём...' : 'Создать проект'}
                onPress={handleSubmit}
                loading={isLoading}
                style={styles.submitBtn}
              />
            </View>
          )}
        </View>
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
  container: {
    flex: 1,
    overflow: 'hidden' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    padding: 0,
  },
  progressArea: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  stepText: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
  formSection: {
    marginBottom: spacing.lg,
    zIndex: 20,
    position: 'relative',
  },

  // ─── Scope cards ───
  scopeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scopeCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  scopeCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  scopeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  scopeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  scopeIconCircleSelected: {
    backgroundColor: 'rgba(123, 45, 62, 0.1)',
  },
  scopeLabel: {
    ...typography.bodyBold,
    color: colors.heading,
    textAlign: 'center',
  },
  scopeLabelSelected: {
    color: colors.primary,
  },
  scopeCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },

  // ─── Type cards ───
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  typeCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    alignItems: 'center',
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeLabel: {
    ...typography.bodyBold,
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

  // ─── Estimate card ───
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
    marginRight: spacing.sm,
  },
  estimateValue: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
    textAlign: 'right',
  },
  estimateValueAccent: {
    ...typography.bodyBold,
    color: colors.primary,
    flex: 1,
    textAlign: 'right',
  },
  disclaimer: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    lineHeight: 18,
  },

  // ─── Bottom bar ───
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  submitRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
  // Auto-filled area badge
  autofilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  autofilledText: {
    ...typography.caption,
    color: colors.success,
  },
});
