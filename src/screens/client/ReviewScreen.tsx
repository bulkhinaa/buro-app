import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import { hapticSuccess, hapticError, hapticLight } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper, Button, TextArea, Card, SystemButton } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useReviewStore } from '../../store/reviewStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const RATING_LABELS = ['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично!'];
const MAX_PHOTOS = 5;

function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (n: number) => void;
}) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => { onRate(n); hapticLight(); }} hitSlop={8}>
          <Ionicons
            name={n <= rating ? 'star' : 'star-outline'}
            size={36}
            color={n <= rating ? colors.primary : colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

interface MasterItem {
  id: string;
  name: string;
  specialization: string;
}

export function ReviewScreen({ navigation, route }: Props) {
  const params = route.params || {};
  const projectId: string = params.projectId || '';
  const supervisorId: string = params.supervisorId || '';
  const supervisorName: string = params.supervisorName || 'Супервайзер';
  const masters: MasterItem[] = params.masters || [];

  const { user } = useAuthStore();
  const submitReview = useReviewStore((s) => s.submitReview);
  const showToast = useToastStore((s) => s.show);

  const [supervisorRating, setSupervisorRating] = useState(0);
  const [masterRatings, setMasterRatings] = useState<Record<string, number>>(
    {},
  );
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]); // URIs
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleMasterRating = (masterId: string, rating: number) => {
    setMasterRatings((prev) => ({ ...prev, [masterId]: rating }));
  };

  // ─── Image picker ───

  const handlePickPhotos = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      showToast(`Максимум ${MAX_PHOTOS} фото`, 'info');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
      });

      if (result.canceled || !result.assets?.length) return;

      const newUris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
      hapticLight();
    } catch {
      showToast('Не удалось открыть галерею', 'error');
    }
  }, [photos.length]);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    hapticLight();
  }, []);

  // ─── Upload photos to Supabase Storage ───

  const uploadPhotos = useCallback(async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    const clientId = user?.id || '';
    const isDev = clientId.startsWith('dev-');

    // Dev users — return local URIs (no upload)
    if (isDev) return photos;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (const uri of photos) {
      try {
        const fileName = `reviews/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from('review-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (!error) {
          const { data } = supabase.storage
            .from('review-photos')
            .getPublicUrl(fileName);
          uploadedUrls.push(data.publicUrl);
        }
      } catch {
        // Skip failed uploads
      }
    }

    setIsUploading(false);
    return uploadedUrls;
  }, [photos, user?.id, projectId]);

  // ─── Submit ───

  const handleSubmit = async () => {
    if (supervisorRating === 0) {
      hapticError();
      showToast('Пожалуйста, оцените супервайзера', 'error');
      return;
    }

    setLoading(true);
    try {
      const clientId = user?.id || '';

      // Upload photos first
      const photoUrls = await uploadPhotos();

      // Submit supervisor review
      if (supervisorId) {
        await submitReview({
          project_id: projectId,
          master_id: supervisorId,
          client_id: clientId,
          rating: supervisorRating,
          text: reviewText || undefined,
          photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        });
      }

      // Submit reviews for each master
      for (const master of masters) {
        const rating = masterRatings[master.id];
        if (rating && rating > 0) {
          await submitReview({
            project_id: projectId,
            master_id: master.id,
            client_id: clientId,
            rating,
          });
        }
      }

      hapticSuccess();
      showToast('Спасибо за отзыв!', 'success');
      navigation.replace('ProjectComplete', route.params);
    } catch {
      showToast('Не удалось отправить отзыв', 'error');
      hapticError();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.replace('ProjectComplete', route.params);
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <Text style={styles.title}>Как всё прошло?</Text>
      <Text style={styles.subtitle}>
        Ваш отзыв поможет другим клиентам и нашим мастерам
      </Text>

      {/* Supervisor rating */}
      <Text style={styles.sectionTitle}>Оцените супервайзера</Text>
      <Text style={styles.personName}>{supervisorName}</Text>
      <StarRating
        rating={supervisorRating}
        onRate={setSupervisorRating}
      />
      {supervisorRating > 0 && (
        <Text style={styles.ratingLabel}>
          {RATING_LABELS[supervisorRating]}
        </Text>
      )}

      {/* Master ratings */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
        Оцените мастеров
      </Text>
      {masters.map((master) => (
        <View key={master.id} style={styles.masterBlock}>
          <Text style={styles.personName}>{master.name}</Text>
          <Text style={styles.specialization}>{master.specialization}</Text>
          <StarRating
            rating={masterRatings[master.id] || 0}
            onRate={(n) => handleMasterRating(master.id, n)}
          />
        </View>
      ))}

      {/* Text review */}
      <View style={{ marginTop: spacing.xxl }}>
        <TextArea
          placeholder="Расскажите о вашем опыте — что понравилось, что можно улучшить (необязательно)"
          value={reviewText}
          onChangeText={setReviewText}
        />
      </View>

      {/* Photo upload */}
      <Text style={styles.photoLabel}>Добавьте фото готового ремонта</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photosRow}
      >
        {photos.map((uri, index) => (
          <View key={uri + index} style={styles.photoThumbContainer}>
            <Image source={{ uri }} style={styles.photoThumb} />
            <Pressable
              style={styles.photoRemoveBtn}
              onPress={() => handleRemovePhoto(index)}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <Pressable
            style={styles.photoButton}
            onPress={handlePickPhotos}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={24} color={colors.textLight} />
                <Text style={styles.photoCount}>
                  {photos.length}/{MAX_PHOTOS}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* Actions */}
      <Button
        title={loading ? 'Отправляем...' : 'Отправить отзыв'}
        onPress={handleSubmit}
        fullWidth
        loading={loading}
        style={{ marginTop: spacing.xxl }}
      />
      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Пропустить</Text>
      </Pressable>

      <View style={{ height: spacing.huge }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
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
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.md,
  },
  personName: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  specialization: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingLabel: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  masterBlock: {
    marginBottom: spacing.xl,
  },
  photoLabel: {
    ...typography.smallBold,
    color: colors.heading,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  photosRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  photoThumbContainer: {
    position: 'relative',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
  photoButton: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoCount: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 10,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  skipText: {
    ...typography.body,
    color: colors.textLight,
  },
});
