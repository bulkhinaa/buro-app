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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScreenWrapper,
  Button,
  Input,
  Chip,
  ProgressBar,
  AppDialog,
  Checkbox,
  TextArea,
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useMasterStore } from '../../store/masterStore';
import { useToastStore } from '../../store/toastStore';
import {
  getSpecializationsByCategory,
  type SpecializationId,
} from '../../data/specializations';
import type {
  ExperienceRange,
  SkillLevel,
  PortfolioProject,
  MasterPricing,
  PriceType,
  MasterSetupData,
} from '../../types';
import { EXPERIENCE_RANGE_LABELS, SKILL_LEVEL_LABELS, PRICE_TYPE_LABELS } from '../../types';

const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};

type Props = {
  onComplete: () => void;
};

const TOTAL_STEPS = 5;

/**
 * Normalize phone from auth (e.g. "+79991234567", "89991234567")
 * to 10-digit format without country code, as PhoneInput expects.
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // Strip leading 7 or 8 (Russian country code prefix)
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

const EXPERIENCE_OPTIONS: { value: ExperienceRange; label: string }[] = [
  { value: 'less_1', label: '< 1 года' },
  { value: '1_3', label: '1–3 года' },
  { value: '3_5', label: '3–5 лет' },
  { value: '5_10', label: '5–10 лет' },
  { value: 'more_10', label: '10+ лет' },
];

const SKILL_LEVELS: { value: SkillLevel; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'beginner', label: 'Начинающий', description: 'Осваиваю профессию, готов учиться', icon: 'leaf-outline' },
  { value: 'experienced', label: 'Опытный', description: 'Уверенно работаю, есть портфолио', icon: 'hammer-outline' },
  { value: 'expert', label: 'Эксперт', description: 'Высший уровень, обучаю других', icon: 'trophy-outline' },
];

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'per_sqm', label: '₽/м²' },
  { value: 'fixed', label: 'Фикс' },
  { value: 'hourly', label: '₽/час' },
];

export function MasterSetupScreen({ onComplete }: Props) {
  const { user } = useAuthStore();
  const { saveDraft, completeSetup, setupDraft } = useMasterStore();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((s) => s.show);

  // Use auth data for name/city/phone — no need to ask again
  const name = setupDraft?.name || user?.name || '';
  const city = setupDraft?.city || user?.city || '';
  const phone = normalizePhone(setupDraft?.phone || user?.phone || '');

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Step 1: Specializations
  const [specializations, setSpecializations] = useState<SpecializationId[]>(setupDraft?.specializations || []);

  // Step 3: Experience
  const [experience, setExperience] = useState<ExperienceRange>(setupDraft?.experience || '1_3');
  const [about, setAbout] = useState(setupDraft?.about || '');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(setupDraft?.skill_level || 'experienced');

  // Step 4: Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>(setupDraft?.portfolio || []);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Step 5: Pricing
  const [pricing, setPricing] = useState<MasterPricing[]>(setupDraft?.pricing || []);

  // Step 6: Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const specCategories = useMemo(() => getSpecializationsByCategory(), []);

  // Validation
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return specializations.length > 0;
      case 2:
        return true; // All have defaults
      case 3:
        return true; // Portfolio is optional
      case 4:
        return true; // Pricing can be skipped
      case 5:
        return agreedToTerms;
      default:
        return false;
    }
  }, [step, specializations, agreedToTerms]);

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      if (!canProceed) {
        if (step === 1) {
          showToast('Выберите хотя бы одну специализацию');
        }
        return;
      }

      // Save draft
      saveDraft({
        name: name.trim(),
        city,
        phone,
        specializations,
        experience,
        about,
        skill_level: skillLevel,
        portfolio,
        pricing,
      });

      // Initialize pricing for new specializations when moving to step 4
      if (step === 3) {
        const existingSpecIds = pricing.map((p) => p.specialization);
        const newPricing = [...pricing];
        specializations.forEach((specId) => {
          if (!existingSpecIds.includes(specId)) {
            newPricing.push({ specialization: specId, price: 0, price_type: 'per_sqm' });
          }
        });
        const filtered = newPricing.filter((p) => specializations.includes(p.specialization));
        setPricing(filtered);
      }

      setStep(step + 1);
    }
  }, [step, canProceed, name, city, phone, specializations, experience, about, skillLevel, portfolio, pricing, showToast, saveDraft]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const handleFinish = useCallback(async () => {
    if (!agreedToTerms) {
      showToast('Необходимо принять условия');
      return;
    }

    setSaving(true);
    try {
      const data: MasterSetupData = {
        name: name.trim(),
        city,
        phone,
        avatar_url: null,
        specializations,
        experience,
        about,
        skill_level: skillLevel,
        portfolio,
        pricing: pricing.filter((p) => p.price > 0),
        certificates: [],
        agreed_to_terms: true,
      };

      await completeSetup(data);
      hapticSuccess();
      setShowSuccess(true);
    } catch {
      showToast('Ошибка сохранения. Попробуйте ещё раз.', 'error');
    } finally {
      setSaving(false);
    }
  }, [agreedToTerms, name, city, phone, specializations, experience, about, skillLevel, portfolio, pricing, completeSetup, showToast]);

  const toggleSpecialization = (id: SpecializationId) => {
    setSpecializations((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const addPortfolioProject = () => {
    if (!newProjectTitle.trim()) {
      showToast('Введите название проекта');
      return;
    }
    const project: PortfolioProject = {
      id: `port-${Date.now()}`,
      title: newProjectTitle.trim(),
      description: newProjectDesc.trim(),
      photos: [],
      created_at: new Date().toISOString(),
    };
    setPortfolio((prev) => [...prev, project]);
    setNewProjectTitle('');
    setNewProjectDesc('');
    setShowAddProject(false);
  };

  const removePortfolioProject = (id: string) => {
    setPortfolio((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePricingValue = (specId: SpecializationId, price: string) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.specialization === specId ? { ...p, price: parseFloat(price) || 0 } : p,
      ),
    );
  };

  const updatePricingType = (specId: SpecializationId, priceType: PriceType) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.specialization === specId ? { ...p, price_type: priceType } : p,
      ),
    );
  };

  // ─── Step renderers ───

  const renderStep2 = () => (
    <>
      <Text style={styles.title}>Специализации</Text>
      <Text style={styles.subtitle}>Выберите все направления, в которых вы работаете</Text>

      {specCategories.map((cat) => (
        <View key={cat.category} style={styles.specCategory}>
          <Text style={styles.sectionTitle}>{cat.label}</Text>
          <View style={styles.chipRow}>
            {cat.items.map((spec) => {
              const selected = specializations.includes(spec.id);
              return (
                <Chip
                  key={spec.id}
                  label={spec.label}
                  selected={selected}
                  onPress={() => toggleSpecialization(spec.id)}
                />
              );
            })}
          </View>
        </View>
      ))}

      {specializations.length > 0 && (
        <Text style={styles.selectedCount}>
          Выбрано: {specializations.length}
        </Text>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.title}>Опыт работы</Text>
      <Text style={styles.subtitle}>Расскажите о вашем опыте</Text>

      <Text style={styles.sectionTitle}>Стаж</Text>
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

      <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Уровень мастерства</Text>
      <View style={styles.levelCardsRow}>
        {SKILL_LEVELS.map((level) => {
          const selected = skillLevel === level.value;
          return (
            <Pressable
              key={level.value}
              onPress={() => setSkillLevel(level.value)}
              style={[styles.levelCard, selected && styles.levelCardSelected]}
            >
              <View style={[styles.levelIconCircle, selected && styles.levelIconCircleSelected]}>
                <Ionicons name={level.icon} size={24} color={selected ? colors.primary : colors.textLight} />
              </View>
              <Text style={[styles.levelLabel, selected && styles.levelLabelSelected]}>{level.label}</Text>
              <Text style={styles.levelDesc}>{level.description}</Text>
              {selected && (
                <View style={styles.levelCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>О себе</Text>
      <TextArea
        value={about}
        onChangeText={setAbout}
        placeholder="Расскажите кратко о себе и вашем опыте (до 200 символов)"
        maxLength={200}
      />
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.title}>Портфолио</Text>
      <Text style={styles.subtitle}>
        Добавьте примеры ваших работ{specializations.includes('designer') ? ' (обязательно для дизайнеров)' : ' (необязательно)'}
      </Text>

      {portfolio.map((project) => (
        <View key={project.id} style={styles.portfolioItem}>
          <View style={styles.portfolioItemHeader}>
            <Text style={styles.portfolioItemTitle}>{project.title}</Text>
            <Pressable onPress={() => removePortfolioProject(project.id)} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </Pressable>
          </View>
          {project.description ? (
            <Text style={styles.portfolioItemDesc}>{project.description}</Text>
          ) : null}
          <Text style={styles.portfolioPhotoHint}>
            <Ionicons name="camera-outline" size={14} color={colors.textLight} /> Фото можно добавить позже
          </Text>
        </View>
      ))}

      {showAddProject ? (
        <View style={styles.addProjectForm}>
          <Input
            placeholder="Название проекта"
            value={newProjectTitle}
            onChangeText={setNewProjectTitle}
          />
          <TextArea
            value={newProjectDesc}
            onChangeText={setNewProjectDesc}
            placeholder="Описание (необязательно)"
            maxLength={200}
          />
          <View style={styles.addProjectActions}>
            <Button
              title="Добавить"
              onPress={addPortfolioProject}
              size="sm"
            />
            <Button
              title="Отмена"
              onPress={() => {
                setShowAddProject(false);
                setNewProjectTitle('');
                setNewProjectDesc('');
              }}
              size="sm"
              variant="outline"
            />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowAddProject(true)}
          style={styles.addProjectButton}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.addProjectText}>Добавить проект</Text>
        </Pressable>
      )}
    </>
  );

  const renderStep5 = () => {
    const specMap = Object.fromEntries(
      getSpecializationsByCategory().flatMap((c) => c.items).map((s) => [s.id, s]),
    );

    return (
      <>
        <Text style={styles.title}>Расценки</Text>
        <Text style={styles.subtitle}>Укажите примерные расценки по каждой специализации</Text>

        {pricing.map((p) => {
          const spec = specMap[p.specialization];
          if (!spec) return null;
          return (
            <View key={p.specialization} style={styles.pricingRow}>
              <View style={styles.pricingHeader}>
                <Ionicons name={spec.icon as any} size={18} color={colors.primary} />
                <Text style={styles.pricingLabel}>{spec.label}</Text>
              </View>
              <View style={styles.pricingInputRow}>
                <TextInput
                  style={[styles.pricingInput, webInputReset]}
                  value={p.price > 0 ? String(p.price) : ''}
                  onChangeText={(text) => updatePricingValue(p.specialization, text)}
                  placeholder="Цена"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textLight}
                />
                <View style={styles.pricingTypeChips}>
                  {PRICE_TYPES.map((pt) => (
                    <Chip
                      key={pt.value}
                      label={pt.label}
                      selected={p.price_type === pt.value}
                      onPress={() => updatePricingType(p.specialization, pt.value)}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        <Text style={styles.pricingHint}>
          Можете заполнить позже в разделе «Расценки»
        </Text>
      </>
    );
  };

  const renderStep6 = () => (
    <>
      <Text style={styles.title}>Завершение</Text>
      <Text style={styles.subtitle}>Последний шаг — подтвердите условия</Text>

      {/* Certificates placeholder */}
      <View style={styles.certSection}>
        <Ionicons name="document-text-outline" size={32} color={colors.textLight} />
        <Text style={styles.certTitle}>Сертификаты и дипломы</Text>
        <Text style={styles.certHint}>Загрузка документов будет доступна в следующей версии</Text>
      </View>

      {/* Agreement */}
      <View style={styles.agreementRow}>
        <Checkbox
          checked={agreedToTerms}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        />
        <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.agreementText}>
            Я принимаю условия использования платформы и даю согласие на обработку персональных данных
          </Text>
        </Pressable>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Ваш профиль</Text>
        <SummaryRow icon="person-outline" label="Имя" value={name} />
        <SummaryRow icon="location-outline" label="Город" value={city} />
        <SummaryRow icon="call-outline" label="Телефон" value={phone} />
        <SummaryRow icon="construct-outline" label="Специализации" value={`${specializations.length} шт.`} />
        <SummaryRow icon="time-outline" label="Стаж" value={EXPERIENCE_RANGE_LABELS[experience]} />
        <SummaryRow icon="trophy-outline" label="Уровень" value={SKILL_LEVEL_LABELS[skillLevel]} />
        {portfolio.length > 0 && (
          <SummaryRow icon="images-outline" label="Портфолио" value={`${portfolio.length} проектов`} />
        )}
      </View>
    </>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      case 4: return renderStep5();
      case 5: return renderStep6();
      default: return null;
    }
  };

  return (
    <ScreenWrapper scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <Button
              title=""
              onPress={handleBack}
              variant="ghost"
              icon={<Ionicons name="arrow-back" size={22} color={colors.heading} />}
              style={styles.backButton}
            />
          ) : (
            <View style={{ width: 44 }} />
          )}
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

        {/* Bottom button */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {step < TOTAL_STEPS ? (
            <Button
              title="Далее →"
              onPress={handleNext}
              fullWidth
            />
          ) : (
            <Button
              title={saving ? 'Сохраняем...' : 'Завершить регистрацию'}
              onPress={handleFinish}
              loading={saving}
              fullWidth
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Success dialog */}
      <AppDialog
        visible={showSuccess}
        onClose={() => {}}
        title="Профиль создан!"
        message="Теперь пройдите верификацию как самозанятый, чтобы начать получать задачи."
        buttons={[
          {
            text: 'Перейти к задачам',
            onPress: () => {
              setShowSuccess(false);
              onComplete();
            },
          },
        ]}
      />
    </ScreenWrapper>
  );
}

// ─── Summary row sub-component ───

function SummaryRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={16} color={colors.textLight} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
    paddingBottom: spacing.huge,
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
    gap: spacing.sm,
    zIndex: 20,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specCategory: {
    marginBottom: spacing.xl,
  },
  selectedCount: {
    ...typography.small,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  // Level cards
  levelCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 140,
    // Glass shadow
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  levelCardSelected: {
    borderColor: 'rgba(123, 45, 62, 0.2)',
    backgroundColor: colors.primaryLight,
  },
  levelIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  levelIconCircleSelected: {
    backgroundColor: 'rgba(123, 45, 62, 0.1)',
  },
  levelLabel: {
    ...typography.smallBold,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: 2,
  },
  levelLabelSelected: {
    color: colors.primary,
  },
  levelDesc: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  levelCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  // Portfolio
  portfolioItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  portfolioItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  portfolioItemTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
  },
  portfolioItemDesc: {
    ...typography.small,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  portfolioPhotoHint: {
    ...typography.caption,
    color: colors.textLight,
  },
  addProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 45, 62, 0.06)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 45, 62, 0.15)',
    borderStyle: 'dashed',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  addProjectText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  addProjectForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addProjectActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  // Pricing
  pricingRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pricingLabel: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  pricingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pricingInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  pricingTypeChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pricingHint: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // Agreement
  certSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.lg,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  certTitle: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  certHint: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
  },
  agreementText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  // Summary
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xl,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textLight,
    width: 100,
  },
  summaryValue: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
    textAlign: 'right',
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
