import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { hapticSuccess } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Input, Button, SystemButton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export function ProfileSetupScreen({ navigation }: Props) {
  const { user, syncProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue = name.trim().length > 0 && city.trim().length > 0;

  const handleContinue = async () => {
    if (!canContinue || !user) return;

    try {
      setLoading(true);
      await syncProfile({
        id: user.id,
        name: name.trim(),
      });
      hapticSuccess();
      // Navigation will be handled by RootNavigator detecting profile completion
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить профиль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.backRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <Text style={styles.title}>Расскажите о себе</Text>
      <Text style={styles.subtitle}>
        Эта информация поможет нам подобрать лучших мастеров для вашего ремонта
      </Text>

      <View style={styles.avatarSection}>
        <Pressable style={styles.avatarCircle}>
          <Ionicons name="camera" size={32} color={colors.primary} />
        </Pressable>
        <Text style={styles.avatarLabel}>Добавить фото</Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder="Как вас зовут?"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Input
          placeholder="Ваш город"
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        <Input
          placeholder="Email (необязательно)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Button
        title={loading ? 'Сохраняем...' : 'Продолжить'}
        onPress={handleContinue}
        disabled={!canContinue}
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
