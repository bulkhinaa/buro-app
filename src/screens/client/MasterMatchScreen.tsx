import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper, Button, GlassView, AppDialog } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { glass } from '../../theme/glass';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';
import {
  SPECIALIZATION_MAP,
} from '../../data/specializations';

interface MasterCandidate {
  id: string;
  name: string;
  avatar_url: string | null;
  specializations: string[];
  rating: number;
  reviews_count: number;
  experience: string;
  skill_level: string;
  is_verified: boolean;
  city: string | null;
  pricing: any[];
  match_score: number;
  score_breakdown: Record<string, number>;
  available_slots: number;
  workload_percent: number;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  less_1: '< 1 года',
  '1_3': '1–3 года',
  '3_5': '3–5 лет',
  '5_10': '5–10 лет',
  more_10: '10+ лет',
};

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Начинающий',
  experienced: 'Опытный',
  expert: 'Эксперт',
};

// Dev mock masters for dev users
const DEV_MASTERS: MasterCandidate[] = [
  {
    id: 'dev-master-1',
    name: 'Алексей Петров',
    avatar_url: null,
    specializations: ['electrician', 'plumber'],
    rating: 4.8,
    reviews_count: 23,
    experience: '5_10',
    skill_level: 'expert',
    is_verified: true,
    city: 'Москва',
    pricing: [{ specialization: 'electrician', price: 2500, price_type: 'per_sqm' }],
    match_score: 92,
    score_breakdown: { specialization: 100, availability: 85, rating: 96, workload: 80, price: 90, experience: 80, geography: 100 },
    available_slots: 48,
    workload_percent: 35,
  },
  {
    id: 'dev-master-2',
    name: 'Сергей Иванов',
    avatar_url: null,
    specializations: ['electrician'],
    rating: 4.5,
    reviews_count: 15,
    experience: '3_5',
    skill_level: 'experienced',
    is_verified: true,
    city: 'Москва',
    pricing: [{ specialization: 'electrician', price: 2000, price_type: 'per_sqm' }],
    match_score: 85,
    score_breakdown: { specialization: 100, availability: 70, rating: 90, workload: 70, price: 95, experience: 60, geography: 100 },
    available_slots: 32,
    workload_percent: 55,
  },
  {
    id: 'dev-master-3',
    name: 'Дмитрий Козлов',
    avatar_url: null,
    specializations: ['electrician', 'general'],
    rating: 4.2,
    reviews_count: 8,
    experience: '1_3',
    skill_level: 'experienced',
    is_verified: false,
    city: 'Москва',
    pricing: [{ specialization: 'electrician', price: 1500, price_type: 'per_sqm' }],
    match_score: 72,
    score_breakdown: { specialization: 100, availability: 60, rating: 84, workload: 50, price: 100, experience: 40, geography: 100 },
    available_slots: 64,
    workload_percent: 20,
  },
];

export function MasterMatchScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.show);

  const { stageIndex, projectId, stageId, stageTitle } = route.params || {};

  const [masters, setMasters] = useState<MasterCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const isDevUser = user?.id?.startsWith('dev-');

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    setLoading(true);

    if (isDevUser) {
      // Dev user: use mock data
      setTimeout(() => {
        setMasters(DEV_MASTERS);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('match-masters', {
        body: {
          stageIndex: stageIndex ?? 0,
          projectId,
          city: user?.city,
          limit: 5,
        },
      });

      if (error) throw error;
      setMasters(data?.masters || []);
    } catch (err) {
      showToast('Не удалось загрузить мастеров', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = useCallback(async () => {
    if (!confirmId) return;
    setSending(true);

    const master = masters.find((m) => m.id === confirmId);

    if (isDevUser) {
      setTimeout(() => {
        showToast(`Предложение отправлено ${master?.name}`, 'success');
        setSending(false);
        setConfirmId(null);
        navigation.goBack();
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase.from('master_offers').insert({
        stage_id: stageId,
        project_id: projectId,
        master_id: confirmId,
        offered_by: user?.id,
        match_score: master?.match_score,
      });

      if (error) throw error;

      // Send push notification to master
      await supabase.functions.invoke('send-push', {
        body: {
          userIds: [confirmId],
          title: 'Новое предложение',
          body: `Вам предложена работа на этапе "${stageTitle}"`,
          data: { type: 'master_offer', stageId, projectId },
        },
      });

      showToast(`Предложение отправлено ${master?.name}`, 'success');
      setConfirmId(null);
      navigation.goBack();
    } catch {
      showToast('Не удалось отправить предложение', 'error');
    } finally {
      setSending(false);
    }
  }, [confirmId, masters, isDevUser, stageId, projectId, stageTitle, user, navigation, showToast]);

  const renderMaster = useCallback(({ item, index }: { item: MasterCandidate; index: number }) => {
    const isSelected = selectedId === item.id;
    const specLabels = item.specializations
      .map((s) => SPECIALIZATION_MAP[s as keyof typeof SPECIALIZATION_MAP]?.label || s)
      .slice(0, 3);

    return (
      <TouchableOpacity
        onPress={() => setSelectedId(isSelected ? null : item.id)}
        activeOpacity={0.8}
      >
        <GlassView
          style={[
            styles.masterCard,
            isSelected && styles.masterCardSelected,
          ]}
        >
          {/* Match score badge */}
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{item.match_score}%</Text>
          </View>

          {index === 0 && (
            <View style={styles.bestMatchBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.bestMatchText}>Лучший подбор</Text>
            </View>
          )}

          <View style={styles.masterRow}>
            {/* Avatar */}
            <View style={styles.avatar}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={28} color={colors.textLight} />
              )}
            </View>

            <View style={styles.masterInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.masterName}>{item.name}</Text>
                {item.is_verified && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                )}
              </View>

              {/* Rating */}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {item.rating.toFixed(1)} ({item.reviews_count})
                </Text>
                <Text style={styles.dotSeparator}>·</Text>
                <Text style={styles.experienceText}>
                  {EXPERIENCE_LABELS[item.experience] || item.experience}
                </Text>
              </View>

              {/* Specializations */}
              <View style={styles.specRow}>
                {specLabels.map((label, i) => (
                  <View key={i} style={styles.specChip}>
                    <Text style={styles.specChipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Expanded details */}
          {isSelected && (
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Уровень</Text>
                <Text style={styles.detailValue}>
                  {SKILL_LABELS[item.skill_level] || item.skill_level}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Загруженность</Text>
                <Text style={styles.detailValue}>{item.workload_percent}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Свободных слотов</Text>
                <Text style={styles.detailValue}>{item.available_slots}</Text>
              </View>
              {item.city && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Город</Text>
                  <Text style={styles.detailValue}>{item.city}</Text>
                </View>
              )}

              <Button
                title="Отправить предложение"
                onPress={() => setConfirmId(item.id)}
                style={styles.offerBtn}
              />
            </View>
          )}
        </GlassView>
      </TouchableOpacity>
    );
  }, [selectedId]);

  return (
    <ScreenWrapper scroll={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Подбор мастера</Text>
          {stageTitle && <Text style={styles.stageTitle}>{stageTitle}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Ищем лучших мастеров...</Text>
        </View>
      ) : masters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Мастера не найдены</Text>
          <Text style={styles.emptyText}>
            Пока нет подходящих мастеров для этого этапа. Попробуйте позже.
          </Text>
        </View>
      ) : (
        <FlatList
          data={masters}
          keyExtractor={(item) => item.id}
          renderItem={renderMaster}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              Найдено {masters.length} мастер{masters.length === 1 ? '' : masters.length < 5 ? 'а' : 'ов'}
            </Text>
          }
        />
      )}

      {/* Confirmation dialog */}
      <AppDialog
        visible={!!confirmId}
        title="Отправить предложение?"
        message={`Мастер получит push-уведомление и сможет принять или отклонить предложение.`}
        onClose={() => setConfirmId(null)}
        buttons={[
          { text: 'Отмена', style: 'cancel', onPress: () => setConfirmId(null) },
          { text: 'Отправить', onPress: handleSendOffer },
        ]}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.heading,
  },
  stageTitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  resultCount: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  masterCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  masterCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  scoreBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bestMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  bestMatchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8860B',
  },
  masterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  masterInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  masterName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.heading,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dotSeparator: {
    fontSize: 13,
    color: colors.textLight,
  },
  experienceText: {
    fontSize: 13,
    color: colors.textLight,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  specChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  details: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.heading,
  },
  offerBtn: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.heading,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});
