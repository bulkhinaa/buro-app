import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button, TextArea, Card, SystemButton } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useReviewStore } from '../../store/reviewStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const RATING_LABELS = ['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично!'];

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
        <Pressable key={n} onPress={() => onRate(n)} hitSlop={8}>
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
  const [loading, setLoading] = useState(false);

  const handleMasterRating = (masterId: string, rating: number) => {
    setMasterRatings((prev) => ({ ...prev, [masterId]: rating }));
  };

  const handleSubmit = async () => {
    if (supervisorRating === 0) {
      hapticError();
      showToast('Пожалуйста, оцените супервайзера', 'error');
      return;
    }

    setLoading(true);
    try {
      const clientId = user?.id || '';

      // Submit supervisor review
      if (supervisorId) {
        await submitReview({
          project_id: projectId,
          master_id: supervisorId,
          client_id: clientId,
          rating: supervisorRating,
          text: reviewText || undefined,
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

      {/* Photo upload placeholder */}
      <Text style={styles.photoLabel}>Добавьте фото готового ремонта</Text>
      <Pressable style={styles.photoButton}>
        <Ionicons name="camera-outline" size={24} color={colors.textLight} />
      </Pressable>

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
  photoButton: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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
