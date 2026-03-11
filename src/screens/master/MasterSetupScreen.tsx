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
// Labels are now provided via i18n (labels.experience.*, labels.skillLevel.*, labels.priceType.*)
import { useTranslation } from 'react-i18next';

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

/**
 * Format 10-digit phone for display: "9991234567" → "+7 999 123-45-67"
 */
function formatPhoneDisplay(digits: string): string {
  if (!digits || digits.length < 10) return digits;
  const d = digits.slice(0, 10);
  return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

const EXPERIENCE_KEYS: { value: ExperienceRange; key: string }[] = [
  { value: 'less_1', key: 'labels.experience.less_1' },
  { value: '1_3', key: 'labels.experience.1_3' },
  { value: '3_5', key: 'labels.experience.3_5' },
  { value: '5_10', key: 'labels.experience.5_10' },
  { value: 'more_10', key: 'labels.experience.more_10' },
];

const SKILL_LEVEL_KEYS: { value: SkillLevel; labelKey: string; descKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'beginner', labelKey: 'master.setup.skillBeginner', descKey: 'master.setup.skillBeginnerDesc', icon: 'leaf-outline' },
  { value: 'experienced', labelKey: 'master.setup.skillExperienced', descKey: 'master.setup.skillExperiencedDesc', icon: 'hammer-outline' },
  { value: 'expert', labelKey: 'master.setup.skillExpert', descKey: 'master.setup.skillExpertDesc', icon: 'trophy-outline' },
];

const PRICE_TYPE_KEYS: { value: PriceType; key: string }[] = [
  { value: 'per_sqm', key: 'labels.priceType.per_sqm' },
  { value: 'fixed', key: 'labels.priceType.fixed' },
  { value: 'hourly', key: 'labels.priceType.hourly' },
];

export function MasterSetupScreen({ onComplete }: Props) {
  const { user } = useAuthStore();
  const { saveDraft, completeSetup, setupDraft } = useMasterStore();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((s) => s.show);
  const { t } = useTranslation();

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
          showToast(t('master.setup.specRequired'));
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
      showToast(t('master.setup.agreementRequired'));
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
      showToast(t('master.setup.saveError'), 'error');
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
      showToast(t('master.setup.projectTitleRequired'));
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
      <Text style={styles.title}>{t('master.setup.specTitle')}</Text>
      <Text style={styles.subtitle}>{t('master.setup.specSubtitle')}</Text>

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
          {t('master.setup.selectedCount', { count: specializations.length })}
        </Text>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.title}>{t('master.setup.expTitle')}</Text>
      <Text style={styles.subtitle}>{t('master.setup.expSubtitle')}</Text>

      <Text style={styles.sectionTitle}>{t('master.setup.tenureLabel')}</Text>
      <View style={styles.chipRow}>
        {EXPERIENCE_KEYS.map((opt) => (
          <Chip
            key={opt.value}
            label={t(opt.key)}
            selected={experience === opt.value}
            onPress={() => setExperience(opt.value)}
          />
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>{t('master.setup.skillLevelLabel')}</Text>
      <View style={styles.levelCardsRow}>
        {SKILL_LEVEL_KEYS.map((level) => {
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
              <Text style={[styles.levelLabel, selected && styles.levelLabelSelected]}>{t(level.labelKey)}</Text>
              <Text style={styles.levelDesc}>{t(level.descKey)}</Text>
              {selected && (
                <View style={styles.levelCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>{t('master.setup.aboutLabel')}</Text>
      <TextArea
        value={about}
        onChangeText={setAbout}
        placeholder={t('master.setup.aboutPlaceholder')}
        maxLength={200}
      />
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.title}>{t('master.setup.portfolioTitle')}</Text>
      <Text style={styles.subtitle}>
        {t('master.setup.portfolioSubtitle')}{specializations.includes('designer') ? t('master.setup.portfolioRequired') : t('master.setup.portfolioOptional')}
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
            <Ionicons name="camera-outline" size={14} color={colors.textLight} /> {t('master.setup.photoLater')}
          </Text>
        </View>
      ))}

      {showAddProject ? (
        <View style={styles.addProjectForm}>
          <Input
            placeholder={t('master.setup.projectTitle')}
            value={newProjectTitle}
            onChangeText={setNewProjectTitle}
          />
          <TextArea
            value={newProjectDesc}
            onChangeText={setNewProjectDesc}
            placeholder={t('master.setup.projectDesc')}
            maxLength={200}
          />
          <View style={styles.addProjectActions}>
            <Button
              title={t('common.add')}
              onPress={addPortfolioProject}
              size="sm"
            />
            <Button
              title={t('common.cancel')}
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
          <Text style={styles.addProjectText}>{t('master.setup.addProject')}</Text>
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
        <Text style={styles.title}>{t('master.setup.pricingTitle')}</Text>
        <Text style={styles.subtitle}>{t('master.setup.pricingSubtitle')}</Text>

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
                  placeholder={t('master.setup.pricePlaceholder')}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textLight}
                />
                <View style={styles.pricingTypeChips}>
                  {PRICE_TYPE_KEYS.map((pt) => (
                    <Chip
                      key={pt.value}
                      label={t(pt.key)}
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
          {t('master.setup.pricingHint')}
        </Text>
      </>
    );
  };

  const renderStep6 = () => (
    <>
      <Text style={styles.title}>{t('master.setup.finishTitle')}</Text>
      <Text style={styles.subtitle}>{t('master.setup.finishSubtitle')}</Text>

      {/* Certificates placeholder */}
      <View style={styles.certSection}>
        <Ionicons name="document-text-outline" size={32} color={colors.textLight} />
        <Text style={styles.certTitle}>{t('master.setup.certsTitle')}</Text>
        <Text style={styles.certHint}>{t('master.setup.certsHint')}</Text>
      </View>

      {/* Agreement */}
      <View style={styles.agreementRow}>
        <Checkbox
          checked={agreedToTerms}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        />
        <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.agreementText}>
            {t('master.setup.agreement')}
          </Text>
        </Pressable>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t('master.setup.summaryTitle')}</Text>
        <SummaryRow icon="person-outline" label={t('summary.name')} value={name || undefined} />
        <SummaryRow icon="location-outline" label={t('summary.city')} value={city || undefined} />
        <SummaryRow icon="call-outline" label={t('summary.phone')} value={phone ? formatPhoneDisplay(phone) : undefined} />
        <SummaryRow icon="construct-outline" label={t('summary.specializations')} value={t('common.items', { count: specializations.length })} />
        <SummaryRow icon="time-outline" label={t('summary.tenure')} value={t(`labels.experience.${experience}`)} />
        <SummaryRow icon="trophy-outline" label={t('summary.level')} value={t(`labels.skillLevel.${skillLevel}`)} />
        {portfolio.length > 0 && (
          <SummaryRow icon="images-outline" label={t('summary.portfolio')} value={t('summary.portfolioCount', { count: portfolio.length })} />
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
            <Text style={styles.stepLabel}>{t('master.setup.stepLabel', { step, total: TOTAL_STEPS })}</Text>
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
              title={t('common.next')}
              onPress={handleNext}
              fullWidth
            />
          ) : (
            <Button
              title={saving ? t('master.setup.saving') : t('master.setup.finishButton')}
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
        title={t('master.setup.successTitle')}
        message={t('master.setup.successMessage')}
        buttons={[
          {
            text: t('master.setup.successButton'),
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

function SummaryRow({ icon, label, value, emptyText }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; emptyText?: string }) {
  const isEmpty = !value || !value.trim();
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={16} color={colors.textLight} />
      <Text style={styles.summaryLabel} numberOfLines={1}>{label}</Text>
      <Text style={[styles.summaryValue, isEmpty && styles.summaryValueEmpty]} numberOfLines={1}>
        {isEmpty ? (emptyText || '—') : value}
      </Text>
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
    gap: spacing.sm,
  },
  pricingInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  pricingTypeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    width: 115,
  },
  summaryValue: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
    textAlign: 'right',
  },
  summaryValueEmpty: {
    ...typography.body,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
