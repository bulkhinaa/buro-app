import React, { useState, useMemo, useCallback } from 'react';
import { hapticSuccess } from '../../utils/haptics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
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
  LayoutCard,
  AppDialog,
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useObjectStore } from '../../store/objectStore';
import { useToastStore } from '../../store/toastStore';
import { filterLayouts } from '../../data/layouts';
import {
  PropertyType,
  RoomCount,
  BathroomConfig,
  KitchenType,
  RenovationGoal,
} from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const TOTAL_STEPS = 4;

// Property type images
const IMG_APARTMENT = require('../../../assets/images/apartment.jpg');
const IMG_HOUSE = require('../../../assets/images/house.jpg');
const IMG_COMMERCIAL = require('../../../assets/images/commercial.jpg');

const PROPERTY_TYPES_DATA: {
  value: PropertyType;
  label: string;
  description: string;
  image: ImageSourcePropType;
}[] = [
  {
    value: 'apartment',
    label: 'Квартира',
    description: 'Типовая, новостройка или вторичка',
    image: IMG_APARTMENT,
  },
  {
    value: 'house',
    label: 'Дом',
    description: 'Частный дом, таунхаус, коттедж',
    image: IMG_HOUSE,
  },
  {
    value: 'commercial',
    label: 'Коммерция',
    description: 'Офис, магазин, салон, ресторан',
    image: IMG_COMMERCIAL,
  },
];

const ROOM_OPTIONS: { value: RoomCount; label: string }[] = [
  { value: 0, label: 'Студия' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
];

const BATHROOM_OPTIONS: { value: BathroomConfig; label: string }[] = [
  { value: 'combined_1', label: '1 совмещённый' },
  { value: 'separate_1', label: '1 раздельный' },
  { value: 'separate_2', label: '2 раздельных' },
];

const KITCHEN_OPTIONS: { value: KitchenType; label: string }[] = [
  { value: 'separate', label: 'Отдельная' },
  { value: 'open', label: 'Кухня-гостиная' },
];

const GOAL_OPTIONS: {
  value: RenovationGoal;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    value: 'living',
    label: 'Для себя',
    icon: 'home-outline',
    description: 'Комфорт и качество',
  },
  {
    value: 'rental',
    label: 'Для сдачи',
    icon: 'key-outline',
    description: 'Практичность и износостойкость',
  },
  {
    value: 'sale',
    label: 'Для продажи',
    icon: 'pricetag-outline',
    description: 'Повышение стоимости',
  },
  {
    value: 'new_build',
    label: 'После покупки',
    icon: 'bag-check-outline',
    description: 'Ремонт новостройки',
  },
];

export function AddObjectScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { addObject } = useObjectStore();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdObjectId, setCreatedObjectId] = useState<string | null>(null);

  // Step 1 — Address & type
  const [address, setAddress] = useState('');
  const [addressValidated, setAddressValidated] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [area, setArea] = useState('');
  const [areaTouched, setAreaTouched] = useState(false);
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');

  // Step 2 — Parameters
  const [rooms, setRooms] = useState<RoomCount>(2);
  const [bathrooms, setBathrooms] = useState<BathroomConfig>('separate_1');
  const [kitchenType, setKitchenType] = useState<KitchenType>('separate');

  // Step 3 — Layout
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [isCustomLayout, setIsCustomLayout] = useState(false);

  // Step 4 — Goal
  const [goal, setGoal] = useState<RenovationGoal>('living');

  // Filter layouts based on parameters
  const availableLayouts = useMemo(
    () => filterLayouts(rooms, bathrooms, kitchenType),
    [rooms, bathrooms, kitchenType],
  );

  // Validation per step
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return addressValidated && area.trim().length > 0 && parseFloat(area) > 0;
      case 2:
        return true; // All have defaults
      case 3:
        return selectedLayoutId !== null || isCustomLayout;
      case 4:
        return true; // Has default
      default:
        return false;
    }
  }, [step, addressValidated, area, selectedLayoutId, isCustomLayout]);

  // Address error message
  const addressError = useMemo(() => {
    if (!addressTouched) return undefined;
    if (address.trim().length === 0) return 'Введите адрес';
    if (!addressValidated) return 'Выберите адрес из подсказок';
    return undefined;
  }, [address, addressValidated, addressTouched]);

  // Area error message
  const areaError = useMemo(() => {
    if (!areaTouched) return undefined;
    if (!area.trim()) return 'Укажите площадь';
    if (parseFloat(area) <= 0) return 'Площадь должна быть больше 0';
    return undefined;
  }, [area, areaTouched]);

  const showToast = useToastStore((s) => s.show);

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      // Validate and show toast with error messages if needed
      if (!canProceed) {
        if (step === 1) {
          setAddressTouched(true);
          setAreaTouched(true);
          if (!address.trim()) {
            showToast('Введите адрес объекта');
          } else if (!addressValidated) {
            showToast('Выберите адрес из подсказок');
          } else if (!area.trim() || parseFloat(area) <= 0) {
            showToast('Укажите площадь объекта');
          }
        } else if (step === 3) {
          showToast('Выберите планировку или загрузите свою');
        }
        return;
      }

      // When moving from step 2 to 3, reset layout selection if params changed
      if (step === 2) {
        setSelectedLayoutId(null);
        setIsCustomLayout(false);
      }
      setStep(step + 1);
    }
  }, [step, canProceed, address, addressValidated, area, showToast]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handleSelectLayout = useCallback((layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setIsCustomLayout(false);
  }, []);

  const handleCustomLayout = useCallback(() => {
    setIsCustomLayout(true);
    setSelectedLayoutId(null);
    // TODO: Open image picker in production
    showToast('В следующей версии можно загрузить фото планировки', 'info');
  }, [showToast]);

  const handleSave = useCallback(async () => {
    if (!user) {
      showToast('Ошибка авторизации. Перезайдите в приложение.', 'error');
      return;
    }
    setSaving(true);
    try {
      const object = await addObject({
        userId: user.id,
        address: address.trim(),
        totalArea: parseFloat(area),
        propertyType,
        rooms,
        bathrooms,
        kitchenType,
        renovationGoal: goal,
        layoutId: selectedLayoutId,
        customLayoutUrl: null,
      });
      setCreatedObjectId(object.id);
      setShowSuccess(true);
      hapticSuccess();
    } catch {
      showToast('Не удалось добавить объект. Попробуйте ещё раз.', 'error');
    } finally {
      setSaving(false);
    }
  }, [user, address, area, propertyType, rooms, bathrooms, kitchenType, goal, selectedLayoutId, addObject]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // ─── Step 1: Address & type ───
  const renderStep1 = () => (
    <>
      <Text style={styles.title}>Добавьте объект</Text>
      <Text style={styles.subtitle}>Укажите адрес и тип жилья</Text>

      <View style={styles.formSection}>
        <AddressInput
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (text.length > 0) setAddressTouched(true);
          }}
          onValidated={setAddressValidated}
          placeholder="Город, улица, дом, квартира"
          error={addressError}
        />

        <Input
          placeholder="Общая площадь, м²"
          value={area}
          onChangeText={(text) => {
            setArea(text);
            if (text.length > 0) setAreaTouched(true);
          }}
          keyboardType="numeric"
          leftIcon={
            <Ionicons name="resize-outline" size={18} color={colors.textLight} />
          }
          error={areaError}
        />
      </View>

      <View style={styles.belowDropdown}>
        <Text style={styles.sectionTitle}>Тип жилья</Text>

        {/* Property type vertical cards */}
        {PROPERTY_TYPES_DATA.map((type) => {
          const isSelected = propertyType === type.value;
          return (
            <Pressable
              key={type.value}
              onPress={() => setPropertyType(type.value)}
              style={[
                styles.typeCard,
                isSelected && styles.typeCardSelected,
              ]}
            >
              {/* Property photo */}
              <View style={styles.typeImageArea}>
                <Image source={type.image} style={styles.typeImage} />
                {isSelected && <View style={styles.typeImageOverlay} />}
              </View>

              {/* Info row below image */}
              <View style={styles.typeInfoRow}>
                <View style={styles.typeTextBlock}>
                  <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                    {type.label}
                  </Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </View>
                {isSelected && (
                  <View style={styles.typeCheckCircle}>
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  // ─── Step 2: Parameters ───
  const renderStep2 = () => (
    <>
      <Text style={styles.title}>Параметры</Text>
      <Text style={styles.subtitle}>Расскажите подробнее об объекте</Text>

      <Text style={styles.sectionTitle}>Комнаты</Text>
      <View style={styles.chipRow}>
        {ROOM_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={rooms === opt.value}
            onPress={() => setRooms(opt.value)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Санузлы</Text>
      <View style={styles.chipRow}>
        {BATHROOM_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={bathrooms === opt.value}
            onPress={() => setBathrooms(opt.value)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Кухня</Text>
      <View style={styles.chipRow}>
        {KITCHEN_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={kitchenType === opt.value}
            onPress={() => setKitchenType(opt.value)}
          />
        ))}
      </View>
    </>
  );

  // ─── Step 3: Layout ───
  const renderStep3 = () => (
    <>
      <Text style={styles.title}>Планировка</Text>
      <Text style={styles.subtitle}>Выберите похожую или загрузите свою</Text>

      {/* Disclaimer */}
      <View style={styles.disclaimerRow}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textLight} />
        <Text style={styles.disclaimerText}>
          Примерная схема — точный план составит супервайзер после осмотра
        </Text>
      </View>

      <View style={styles.layoutGrid}>
        {availableLayouts.map((layout) => {
          // Show "best match" badge for layouts matching bathroom + kitchen
          const isBestMatch =
            layout.bathrooms === bathrooms && layout.kitchen_type === kitchenType;
          return (
            <View key={layout.id} style={styles.layoutCell}>
              <LayoutCard
                svg={layout.svg}
                name={layout.name}
                description={layout.description}
                areaRange={`${layout.area_range.min}–${layout.area_range.max} м²`}
                selected={selectedLayoutId === layout.id}
                onPress={() => handleSelectLayout(layout.id)}
                badge={isBestMatch ? 'Подходит' : undefined}
              />
            </View>
          );
        })}

        {/* Custom layout card */}
        <View style={styles.layoutCell}>
          <LayoutCard
            name="Своя планировка"
            description="Загрузите фото"
            isCustom
            selected={isCustomLayout}
            onPress={handleCustomLayout}
          />
        </View>
      </View>
    </>
  );

  // ─── Step 4: Goal ───
  const renderStep4 = () => (
    <>
      <Text style={styles.title}>Цель ремонта</Text>
      <Text style={styles.subtitle}>
        Это поможет подобрать оптимальные решения
      </Text>

      <View style={styles.goalGrid}>
        {GOAL_OPTIONS.map((opt) => (
          <View key={opt.value} style={styles.goalCell}>
            <GoalCard
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              selected={goal === opt.value}
              onPress={() => setGoal(opt.value)}
            />
          </View>
        ))}
      </View>
    </>
  );

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
            <Text style={styles.stepLabel}>Шаг {step} из {TOTAL_STEPS}</Text>
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
          {renderStep()}
        </ScrollView>

        {/* Bottom button — always active, toast on errors */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {step < TOTAL_STEPS ? (
            <Button
              title="Далее →"
              onPress={handleNext}
              fullWidth
            />
          ) : (
            <Button
              title={saving ? 'Добавляем...' : 'Добавить объект'}
              onPress={handleSave}
              loading={saving}
              fullWidth
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Success dialog */}
      <AppDialog
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Объект добавлен!"
        message="Теперь вы можете создать проект ремонта для этого объекта"
        buttons={[
          {
            text: 'Создать проект',
            onPress: () => {
              setShowSuccess(false);
              navigation.replace('CreateProject', {
                objectId: createdObjectId,
                objectAddress: address.trim(),
                objectArea: parseFloat(area),
              });
            },
          },
          {
            text: 'На главную',
            style: 'cancel' as const,
            onPress: () => {
              setShowSuccess(false);
              navigation.goBack();
            },
          },
        ]}
      />
    </ScreenWrapper>
  );
}

// ─── Goal card sub-component ───

function GoalCard({
  icon,
  label,
  description,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.goalCard, selected && styles.goalCardSelected]}
    >
      <View style={styles.goalCardContent}>
        <View style={[styles.goalIconCircle, selected && styles.goalIconCircleSelected]}>
          <Ionicons
            name={icon}
            size={28}
            color={selected ? colors.primary : colors.textLight}
          />
        </View>
        <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
          {label}
        </Text>
        <Text style={styles.goalDescription}>{description}</Text>
        {selected && (
          <View style={styles.goalCheck}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
        )}
      </View>
    </Pressable>
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
  stepLabel: {
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
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.xxl,
  },
  formSection: {
    marginBottom: spacing.lg,
    zIndex: 20,
    position: 'relative',
  },
  belowDropdown: {
    zIndex: 1,
  },
  // Property type vertical cards
  typeCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    // Glass shadow
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  typeCardSelected: {
    borderColor: 'rgba(123, 45, 62, 0.2)',
    backgroundColor: colors.primaryLight,
    shadowColor: 'rgba(123, 45, 62, 0.1)',
    elevation: 5,
  },
  typeImageArea: {
    height: 160,
    backgroundColor: colors.bgCard,
  },
  typeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  typeImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(123, 45, 62, 0.12)',
  },
  typeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  typeTextBlock: {
    flex: 1,
  },
  typeLabel: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  typeLabelSelected: {
    color: colors.primary,
  },
  typeDescription: {
    ...typography.small,
    color: colors.textLight,
  },
  typeCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Disclaimer
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 165, 90, 0.08)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  disclaimerText: {
    ...typography.small,
    color: colors.textLight,
    flex: 1,
  },
  // Layout grid
  layoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  layoutCell: {
    width: '48%',
    flexGrow: 1,
  },
  // Goal grid
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalCell: {
    width: '48%',
    flexGrow: 1,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    height: 160,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  goalCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  goalIconCircleSelected: {
    backgroundColor: 'rgba(123, 45, 62, 0.1)',
  },
  goalLabel: {
    ...typography.bodyBold,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: 2,
  },
  goalLabelSelected: {
    color: colors.primary,
  },
  goalDescription: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  goalCheck: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
