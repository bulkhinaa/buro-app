import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { hapticSuccess } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Input, Button, SystemButton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export function ProfileSetupScreen({ navigation }: Props) {
  const { user, syncProfile } = useAuthStore();
  const showToast = useToastStore((s) => s.show);
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);

  const nameError = nameTouched && !name.trim() ? t('profileSetup.nameRequired') : undefined;
  const cityError = cityTouched && !city.trim() ? t('profileSetup.cityRequired') : undefined;

  const handleContinue = async () => {
    // Mark all fields as touched
    setNameTouched(true);
    setCityTouched(true);

    if (!name.trim()) {
      showToast(t('profileSetup.nameRequired'), 'error');
      return;
    }
    if (!city.trim()) {
      showToast(t('profileSetup.cityRequired'), 'error');
      return;
    }
    if (!user) return;

    try {
      setLoading(true);
      await syncProfile({
        id: user.id,
        name: name.trim(),
        city: city.trim(),
      });
      hapticSuccess();
      // Navigation will be handled by RootNavigator detecting profile completion
    } catch (e: any) {
      showToast(e.message || t('profileSetup.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.backRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <Text style={styles.title}>{t('profileSetup.title')}</Text>
      <Text style={styles.subtitle}>{t('profileSetup.subtitle')}</Text>

      <View style={styles.avatarSection}>
        <Pressable style={styles.avatarCircle}>
          <Ionicons name="camera" size={32} color={colors.primary} />
        </Pressable>
        <Text style={styles.avatarLabel}>{t('profileSetup.addPhoto')}</Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder={t('profileSetup.namePlaceholder')}
          value={name}
          onChangeText={(v) => { setName(v); setNameTouched(true); }}
          autoCapitalize="words"
          error={nameError}
        />

        <Input
          placeholder={t('profileSetup.cityPlaceholder')}
          value={city}
          onChangeText={(v) => { setCity(v); setCityTouched(true); }}
          autoCapitalize="words"
          error={cityError}
        />

        <Input
          placeholder={t('profileSetup.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Button
        title={loading ? t('profileSetup.saving') : t('profileSetup.continue')}
        onPress={handleContinue}
        loading={loading}
        fullWidth
        style={{ marginTop: spacing.xxl }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  form: {
    gap: spacing.md,
  },
});
