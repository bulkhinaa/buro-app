import React, { useState } from 'react';
import { hapticSuccess } from '../../utils/haptics';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Input, Button, CityPicker } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export function EditProfileScreen({ navigation }: Props) {
  const { user, saveProfile } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    try {
      await saveProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim() || undefined,
      });
      hapticSuccess();
      navigation.goBack();
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPress = () => {
    // In production: open image picker
    Alert.alert(
      'Фото профиля',
      'Выберите действие',
      [
        { text: 'Сделать фото', onPress: () => {} },
        { text: 'Выбрать из галереи', onPress: () => {} },
        ...(user?.avatar_url
          ? [{ text: 'Удалить фото', style: 'destructive' as const, onPress: () => {} }]
          : []),
        { text: 'Отмена', style: 'cancel' as const },
      ],
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar */}
          <Pressable style={styles.avatarSection} onPress={handleAvatarPress}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name ? name[0].toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraCircle}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
            <Text style={styles.changePhotoText}>Изменить фото</Text>
          </Pressable>

          {/* Form */}
          <View style={styles.form}>
            <Input
              placeholder="Имя и фамилия"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon={
                <Ionicons name="person-outline" size={18} color={colors.textLight} />
              }
            />
            <Input
              placeholder="Телефон"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={
                <Ionicons name="call-outline" size={18} color={colors.textLight} />
              }
            />
            <CityPicker
              value={city}
              onSelect={setCity}
              placeholder="Город"
            />
          </View>

          <Button
            title={saving ? 'Сохраняем...' : 'Сохранить'}
            onPress={handleSave}
            disabled={!canSave || saving}
            loading={saving}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  cameraCircle: {
    position: 'absolute',
    bottom: 24,
    right: '50%',
    marginRight: -48,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  changePhotoText: {
    ...typography.small,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  form: {
    marginBottom: spacing.xl,
    zIndex: 100,
    elevation: 100,
  },
});
