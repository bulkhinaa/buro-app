import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button, Chip } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useMasterStore } from '../../store/masterStore';
import { useToastStore } from '../../store/toastStore';
import { hapticSuccess } from '../../utils/haptics';
import { getSpecializationsByCategory } from '../../data/specializations';
import type { MasterPricing, PriceType } from '../../types';

const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'per_sqm', label: '₽/м²' },
  { value: 'fixed', label: 'Фикс' },
  { value: 'hourly', label: '₽/час' },
];

export function MasterPricingScreen({ navigation }: any) {
  const profile = useMasterStore((s) => s.profile);
  const updatePricing = useMasterStore((s) => s.updatePricing);
  const showToast = useToastStore((s) => s.show);

  const specMap = Object.fromEntries(
    getSpecializationsByCategory().flatMap((c) => c.items).map((s) => [s.id, s]),
  );

  // Initialize pricing from profile or create defaults for each specialization
  const initialPricing: MasterPricing[] = (profile?.specializations || []).map((specId) => {
    const existing = profile?.pricing.find((p) => p.specialization === specId);
    return existing || { specialization: specId, price: 0, price_type: 'per_sqm' as PriceType };
  });

  const [pricing, setPricing] = useState<MasterPricing[]>(initialPricing);

  const updatePrice = (specId: string, text: string) => {
    const num = parseInt(text.replace(/\D/g, ''), 10) || 0;
    setPricing((prev) =>
      prev.map((p) => (p.specialization === specId ? { ...p, price: num } : p)),
    );
  };

  const updateType = (specId: string, type: PriceType) => {
    setPricing((prev) =>
      prev.map((p) => (p.specialization === specId ? { ...p, price_type: type } : p)),
    );
  };

  const handleSave = async () => {
    await updatePricing(pricing);
    hapticSuccess();
    showToast('Расценки сохранены', 'success');
    navigation.goBack();
  };

  return (
    <ScreenWrapper scroll={false} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colors.heading}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Мои расценки</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            Клиенты видят ваши расценки при выборе мастера
          </Text>
        </View>

        {/* Pricing rows */}
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
                  onChangeText={(text) => updatePrice(p.specialization, text)}
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
                      onPress={() => updateType(p.specialization, pt.value)}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        {pricing.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>Нет специализаций</Text>
            <Text style={styles.emptySubtext}>
              Добавьте специализации в настройках профиля
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky save button */}
      <View style={styles.bottomBar}>
        <Button title="Сохранить" onPress={handleSave} fullWidth />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.heading,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(123, 45, 62, 0.06)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
  },
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyText: {
    ...typography.h3,
    color: colors.heading,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  bottomBar: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
  },
});
