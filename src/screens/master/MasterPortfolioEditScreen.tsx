import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper, Input, TextArea, Button } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useMasterStore } from '../../store/masterStore';
import { useToastStore } from '../../store/toastStore';
import { hapticSuccess } from '../../utils/haptics';
import type { PortfolioProject } from '../../types';

const MAX_PHOTOS = 5;

export function MasterPortfolioEditScreen({ navigation, route }: any) {
  const projectId = route?.params?.projectId as string | undefined;
  const profile = useMasterStore((s) => s.profile);
  const addPortfolioProject = useMasterStore((s) => s.addPortfolioProject);
  const updatePortfolioProject = useMasterStore((s) => s.updatePortfolioProject);
  const showToast = useToastStore((s) => s.show);

  const existing = projectId
    ? profile?.portfolio.find((p) => p.id === projectId)
    : undefined;

  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos || []);
  const [titleTouched, setTitleTouched] = useState(false);

  const isEditing = !!existing;
  const titleError = titleTouched && !title.trim() ? 'Введите название проекта' : undefined;

  const handlePickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      showToast(`Максимум ${MAX_PHOTOS} фото`, 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setTitleTouched(true);
    if (!title.trim()) {
      showToast('Введите название проекта', 'error');
      return;
    }

    const project: PortfolioProject = {
      id: existing?.id || `port-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      photos,
      created_at: existing?.created_at || new Date().toISOString(),
    };

    if (isEditing) {
      await updatePortfolioProject(project);
    } else {
      await addPortfolioProject(project);
    }

    hapticSuccess();
    showToast(isEditing ? 'Проект обновлён' : 'Проект добавлен', 'success');
    navigation.goBack();
  };

  return (
    <ScreenWrapper scroll={false} edges={[]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.heading} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Редактировать проект' : 'Новый проект'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            placeholder="Название проекта"
            value={title}
            onChangeText={setTitle}
            onBlur={() => setTitleTouched(true)}
            error={titleError}
            leftIcon={<Ionicons name="construct-outline" size={18} color={colors.textLight} />}
            clearable
          />

          <View style={{ height: spacing.lg }} />

          <TextArea
            placeholder="Описание работ (необязательно)"
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />

          <View style={{ height: spacing.xl }} />

          {/* Photos */}
          <Text style={styles.photosLabel}>
            Фото работ ({photos.length}/{MAX_PHOTOS})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosScroll}
            contentContainerStyle={styles.photosContent}
          >
            {photos.map((uri, index) => (
              <View key={uri + index} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => handleRemovePhoto(index)}
                  hitSlop={6}
                >
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}

            {photos.length < MAX_PHOTOS && (
              <Pressable style={styles.addPhotoButton} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={28} color={colors.primary} />
                <Text style={styles.addPhotoText}>Добавить</Text>
              </Pressable>
            )}
          </ScrollView>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky save button */}
        <View style={styles.bottomBar}>
          <Button title="Сохранить" onPress={handleSave} fullWidth />
        </View>
      </KeyboardAvoidingView>
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
  photosLabel: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.md,
  },
  photosScroll: {
    marginHorizontal: -spacing.xl,
  },
  photosContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 45, 62, 0.15)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(123, 45, 62, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    ...typography.caption,
    color: colors.primary,
  },
  bottomBar: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
  },
});
