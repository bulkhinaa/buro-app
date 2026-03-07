import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Chip, Card } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - CARD_GAP) / 2;

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface PortfolioCase {
  id: string;
  imageUrl: string;
  repairType: string;
  area: string;
  cost: string;
  rating: number;
}

const FILTER_OPTIONS = ['Все', 'Косметический', 'Стандартный', 'Капитальный', 'Дизайнерский'];

// Mock data — will be replaced with real API data
const MOCK_CASES: PortfolioCase[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
    repairType: 'Стандартный',
    area: '54 м²',
    cost: '870 000 ₽',
    rating: 4.9,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    repairType: 'Капитальный',
    area: '78 м²',
    cost: '1 560 000 ₽',
    rating: 5.0,
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
    repairType: 'Косметический',
    area: '38 м²',
    cost: '285 000 ₽',
    rating: 4.8,
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=400',
    repairType: 'Дизайнерский',
    area: '92 м²',
    cost: '3 200 000 ₽',
    rating: 5.0,
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
    repairType: 'Стандартный',
    area: '45 м²',
    cost: '720 000 ₽',
    rating: 4.7,
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400',
    repairType: 'Косметический',
    area: '28 м²',
    cost: '196 000 ₽',
    rating: 4.6,
  },
];

export function PortfolioScreen({ navigation }: Props) {
  const [selectedFilter, setSelectedFilter] = useState('Все');

  const filteredCases =
    selectedFilter === 'Все'
      ? MOCK_CASES
      : MOCK_CASES.filter((c) => c.repairType === selectedFilter);

  const renderCase = ({ item }: { item: PortfolioCase }) => (
    <Pressable
      style={styles.caseCard}
      onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.caseImage} />
        <View style={styles.chipOverlay}>
          <Chip label={item.repairType} />
        </View>
      </View>
      <View style={styles.caseInfo}>
        <Text style={styles.caseArea}>{item.area}</Text>
        <Text style={styles.caseCost}>{item.cost}</Text>
        <View style={styles.caseRating}>
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text style={styles.caseRatingText}>{item.rating}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.title}>Наши работы</Text>
      <Text style={styles.subtitle}>Реальные проекты наших клиентов</Text>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTER_OPTIONS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <Chip
            label={item}
            selected={selectedFilter === item}
            onPress={() => setSelectedFilter(item)}
          />
        )}
      />

      {/* Grid */}
      {filteredCases.length > 0 ? (
        <FlatList
          data={filteredCases}
          renderItem={renderCase}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={56} color={colors.primary} style={{ marginBottom: spacing.lg }} />
          <Text style={styles.emptyTitle}>Скоро здесь появятся проекты</Text>
          <Text style={styles.emptyText}>
            Мы работаем над первыми объектами
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.heading,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  filterList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  grid: {
    paddingBottom: spacing.huge,
  },
  caseCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    position: 'relative',
  },
  caseImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    resizeMode: 'cover',
  },
  chipOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
  },
  caseInfo: {
    padding: spacing.md,
  },
  caseArea: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  caseCost: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  caseRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caseRatingText: {
    ...typography.small,
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  // emptyIcon style removed — now using Ionicons inline
  emptyTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
});
