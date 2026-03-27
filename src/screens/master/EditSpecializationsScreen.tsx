import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScreenWrapper, SharedHeader, GlassChip, Button } from '../../components';
import { spacing, radius, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useMasterStore } from '../../store/masterStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';
import {
  getSpecializationsByCategory,
  type SpecializationId,
} from '../../data/specializations';

type MasterStackParamList = {
  EditSpecializations: undefined;
  Profile: undefined;
  NotificationsStack: undefined;
};

type EditSpecializationsNavProp = StackNavigationProp<MasterStackParamList, 'EditSpecializations'>;

/**
 * EditSpecializationsScreen — allows the master to edit their specializations.
 * Reuses the same category-grouped layout from MasterSetupScreen step 1.
 */
export function EditSpecializationsScreen({ navigation }: { navigation: EditSpecializationsNavProp }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const profile = useMasterStore((s) => s.profile);
  const updateProfile = useMasterStore((s) => s.updateProfile);
  const showToast = useToastStore((s) => s.show);

  const [selected, setSelected] = useState<SpecializationId[]>(
    profile?.specializations ?? [],
  );
  const [saving, setSaving] = useState(false);

  const categories = getSpecializationsByCategory();

  const toggleSpec = useCallback((id: SpecializationId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Persist to Supabase
      const { error } = await supabase
        .from('master_profiles')
        .update({ specializations: selected })
        .eq('id', user.id);

      if (error) throw error;

      // Update local store
      await updateProfile({ specializations: selected });
      navigation.goBack();
    } catch {
      showToast(t('master.setup.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <SharedHeader
        title={t('profile.specializations')}
        subtitle={t('master.setup.specSubtitle')}
        onAvatarPress={() => navigation.navigate('Profile')}
        onNotificationPress={() => navigation.navigate('NotificationsStack')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((cat) => (
          <View key={cat.category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.heading }]}>
              {cat.label}
            </Text>
            <View style={styles.chipRow}>
              {cat.items.map((spec) => {
                const isSelected = selected.includes(spec.id);
                return (
                  <GlassChip
                    key={spec.id}
                    label={spec.label}
                    size="md"
                    active={isSelected}
                    onPress={() => toggleSpec(spec.id)}
                  />
                );
              })}
            </View>
          </View>
        ))}

        {selected.length > 0 && (
          <Text style={[styles.selectedCount, { color: colors.textLight }]}>
            {t('master.setup.selectedCount', { count: selected.length })}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={saving ? t('master.setup.saving') : t('common.save')}
            onPress={handleSave}
            disabled={saving}
          />
          {saving && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.spinner}
            />
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedCount: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  spinner: {
    marginLeft: spacing.sm,
  },
});
