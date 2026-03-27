import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';

interface UserReview {
  id: string;
  projectTitle: string;
  masterName: string;
  rating: number;
  text: string;
  date: string;
}

// Mock data — will be replaced with real API data
const MOCK_REVIEWS: UserReview[] = [
  {
    id: '1',
    projectTitle: 'Стандартный ремонт · ул. Ленина, 15',
    masterName: 'Иван Петров',
    rating: 5,
    text: 'Отличная работа! Всё сделано качественно и в срок. Мастер очень аккуратный, после работы всё убрал.',
    date: '15 января 2026',
  },
  {
    id: '2',
    projectTitle: 'Стандартный ремонт · ул. Ленина, 15',
    masterName: 'Алексей Козлов',
    rating: 4,
    text: 'В целом доволен. Были мелкие замечания по штукатурке, но мастер оперативно всё исправил.',
    date: '22 декабря 2024',
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={colors.primary}
        />
      ))}
    </View>
  );
}

export function MyReviewsScreen() {
  const [reviews] = useState<UserReview[]>(MOCK_REVIEWS);

  const renderReview = ({ item }: { item: UserReview }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.masterInfo}>
          <View style={styles.masterAvatar}>
            <Text style={styles.masterAvatarText}>
              {item.masterName[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.masterName}>{item.masterName}</Text>
            <Text style={styles.projectTitle}>{item.projectTitle}</Text>
          </View>
        </View>
        <StarRow rating={item.rating} />
      </View>
      <Text style={styles.reviewText}>{item.text}</Text>
      <Text style={styles.reviewDate}>{item.date}</Text>
    </View>
  );

  return (
    <ScreenWrapper scroll={false}>
      {reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="clipboard-outline"
            size={56}
            color={colors.primary}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={styles.emptyTitle}>Нет отзывов</Text>
          <Text style={styles.emptyText}>
            После завершения проекта вы сможете{'\n'}оставить отзыв о мастерах
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
    paddingTop: spacing.sm,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  reviewHeader: {
    marginBottom: spacing.md,
  },
  masterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  masterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  masterAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  masterName: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  projectTitle: {
    ...typography.small,
    color: colors.textLight,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  reviewDate: {
    ...typography.caption,
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});
