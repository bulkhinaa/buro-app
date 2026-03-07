import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  StatusBadge,
  Button,
  MapPreview,
  Chip,
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { Project, REPAIR_TYPE_LABELS } from '../../types';
import { formatRubles } from '../../utils/calculator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PORTFOLIO_CARD_WIDTH = 280;

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// How-it-works step data
const HOW_IT_WORKS = [
  {
    icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Оставьте заявку',
    text: 'Расскажите о квартире и типе ремонта — это займёт 2 минуты',
  },
  {
    icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Мы подберём команду',
    text: 'Супервайзер составит план, подберёт мастеров и согласует смету',
  },
  {
    icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Контроль и результат',
    text: 'Независимый контроль на каждом этапе. Вы видите прогресс в приложении',
  },
];

// Mock portfolio data (will be replaced with real data from API)
const MOCK_PORTFOLIO = [
  {
    id: 'portfolio-1',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
    repairType: 'Стандартный',
    area: '54 м²',
    address: 'ул. Ленина, 15',
    cost: '870 000 ₽',
    duration: '45 дней',
    rating: 4.9,
    reviewCount: 12,
  },
  {
    id: 'portfolio-2',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
    repairType: 'Капитальный',
    area: '78 м²',
    address: 'пр. Мира, 42',
    cost: '1 560 000 ₽',
    duration: '72 дня',
    rating: 5.0,
    reviewCount: 8,
  },
  {
    id: 'portfolio-3',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600',
    repairType: 'Косметический',
    area: '38 м²',
    address: 'ул. Пушкина, 8',
    cost: '285 000 ₽',
    duration: '21 день',
    rating: 4.8,
    reviewCount: 15,
  },
];

export function ClientHomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { projects, isLoading, loadProjects } = useProjectStore();

  const refresh = useCallback(() => {
    if (user?.id) loadProjects(user.id);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renderProject = ({ item }: { item: Project }) => (
    <Pressable
      onPress={() =>
        navigation.navigate('ProjectDetail', {
          projectId: item.id,
          project: item,
        })
      }
    >
      <Card style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <StatusBadge status={item.status} type="project" />
          <Text style={styles.projectDate}>
            {new Date(item.created_at).toLocaleDateString('ru-RU')}
          </Text>
        </View>
        <Text style={styles.projectTitle}>{item.title}</Text>
        <Text style={styles.projectAddress}>{item.address}</Text>
        <MapPreview address={item.address} />
        <View style={styles.projectMeta}>
          <Chip label={`${item.area_sqm} м²`} />
          <Chip label={REPAIR_TYPE_LABELS[item.repair_type]} />
        </View>
        {item.budget_min != null && item.budget_max != null && (
          <Text style={styles.projectBudget}>
            {formatRubles(item.budget_min)} – {formatRubles(item.budget_max)}
          </Text>
        )}
      </Card>
    </Pressable>
  );

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Привет,</Text>
          <Text style={styles.greetingName}>
            {user?.name || 'Клиент'}!
          </Text>
        </View>
        <Pressable
          style={styles.avatarButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name[0].toUpperCase() : '?'}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Banner */}
        <View style={styles.padded}>
          <Card style={styles.heroBanner}>
            <Text style={styles.heroTitle}>
              Рассчитайте стоимость ремонта за 2 минуты
            </Text>
            <Text style={styles.heroSubtitle}>
              Укажите площадь и тип ремонта — мы покажем примерные сроки и
              бюджет
            </Text>
            <Button
              title="Рассчитать →"
              onPress={() => navigation.navigate('CreateProject')}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        </View>

        {/* How it works */}
        <Text style={[styles.sectionTitle, styles.padded]}>
          Как это работает
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.howItWorksScroll}
        >
          {HOW_IT_WORKS.map((step, i) => (
            <Card key={i} style={styles.howItWorksCard}>
              <Ionicons name={step.icon} size={32} color={colors.primary} style={{ marginBottom: spacing.md }} />
              <Text style={styles.howItWorksTitle}>{step.title}</Text>
              <Text style={styles.howItWorksText}>{step.text}</Text>
            </Card>
          ))}
        </ScrollView>

        {/* Platform stats */}
        <Text style={[styles.sectionTitle, styles.padded]}>Нам доверяют</Text>
        <View style={[styles.statsRow, styles.padded]}>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>150+</Text>
            <Text style={styles.statLabel}>проектов{'\n'}завершено</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>средний{'\n'}рейтинг</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>клиентов{'\n'}довольны</Text>
          </View>
        </View>

        {/* Portfolio carousel */}
        <View style={[styles.sectionHeaderRow, styles.padded]}>
          <Text style={styles.sectionTitle}>Реализованные проекты</Text>
          <Pressable onPress={() => navigation.navigate('Portfolio')}>
            <Text style={styles.sectionLink}>Все →</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.portfolioScroll}
        >
          {MOCK_PORTFOLIO.map((item) => (
            <Pressable
              key={item.id}
              style={styles.portfolioCard}
              onPress={() =>
                navigation.navigate('CaseDetail', { caseId: item.id })
              }
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.portfolioImage}
              />
              <View style={styles.portfolioInfo}>
                <Chip label={item.repairType} />
                <Text style={styles.portfolioArea}>
                  {item.area} · {item.address}
                </Text>
                <Text style={styles.portfolioCost}>{item.cost}</Text>
                <View style={styles.portfolioBottom}>
                  <Text style={styles.portfolioDuration}>{item.duration}</Text>
                  <View style={styles.portfolioRating}>
                    <Ionicons name="star" size={12} color={colors.primary} />
                    <Text style={styles.portfolioRatingText}>
                      {item.rating} ({item.reviewCount})
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* My Projects */}
        <Text style={[styles.sectionTitle, styles.padded]}>Мои проекты</Text>
        <View style={styles.padded}>
          {projects.length > 0 ? (
            projects.map((project) => (
              <View key={project.id}>
                {renderProject({ item: project })}
              </View>
            ))
          ) : !isLoading ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="home-outline" size={56} color={colors.primary} style={{ marginBottom: spacing.lg }} />
              <Text style={styles.emptyTitle}>Начните свой первый ремонт</Text>
              <Text style={styles.emptyText}>
                Создайте проект — мы рассчитаем стоимость{'\n'}и назначим
                супервайзера
              </Text>
              <Button
                title="Создать проект"
                onPress={() => navigation.navigate('CreateProject')}
                style={{ marginTop: spacing.xl }}
              />
            </Card>
          ) : null}
        </View>

        {/* CTA Banner */}
        <View style={styles.padded}>
          <View style={styles.ctaBanner}>
            <Text style={styles.ctaTitle}>Есть вопросы?</Text>
            <Text style={styles.ctaText}>
              Напишите нам — ответим в течение 15 минут
            </Text>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Написать в поддержку</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: spacing.huge }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  greetingText: {
    ...typography.body,
    color: colors.textLight,
  },
  greetingName: {
    ...typography.h1,
    color: colors.heading,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
  // Hero Banner
  heroBanner: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.xxl,
  },
  heroTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textLight,
    lineHeight: 22,
  },
  // Section titles
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLink: {
    ...typography.body,
    color: colors.primary,
  },
  // How it works
  howItWorksScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  howItWorksCard: {
    width: 240,
    padding: spacing.lg,
  },
  // howItWorksIcon style removed — now using Ionicons inline
  howItWorksTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  howItWorksText: {
    ...typography.small,
    color: colors.textLight,
    lineHeight: 18,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xxl,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  // Portfolio
  portfolioScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  portfolioCard: {
    width: PORTFOLIO_CARD_WIDTH,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  portfolioImage: {
    width: PORTFOLIO_CARD_WIDTH,
    height: 180,
    resizeMode: 'cover',
  },
  portfolioInfo: {
    padding: spacing.md,
  },
  portfolioArea: {
    ...typography.small,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  portfolioCost: {
    ...typography.bodyBold,
    color: colors.heading,
    marginTop: spacing.xs,
  },
  portfolioBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  portfolioDuration: {
    ...typography.small,
    color: colors.textLight,
  },
  portfolioRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  portfolioRatingText: {
    ...typography.small,
    color: colors.textLight,
  },
  // My Projects
  projectCard: {
    marginBottom: spacing.lg,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  projectDate: {
    ...typography.small,
    color: colors.textLight,
  },
  projectTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  projectAddress: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  projectBudget: {
    ...typography.bodyBold,
    color: colors.gold,
  },
  // Empty
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    marginTop: spacing.sm,
  },
  // emptyIcon style removed — now using Ionicons inline
  emptyTitle: {
    ...typography.h2,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  // CTA Banner
  ctaBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  ctaTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  ctaText: {
    ...typography.body,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
