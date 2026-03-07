import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { LevelBadge, MasterLevel } from './LevelBadge';

interface LabelMasterProps {
  level: MasterLevel;
  rating: number;
  reviewCount: number;
  visitCount?: number;
}

export function LabelMaster({
  level,
  rating,
  reviewCount,
  visitCount,
}: LabelMasterProps) {
  return (
    <View style={styles.container}>
      <LevelBadge level={level} variant="outline" size="sm" />
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color={colors.primary} />
        <Text style={styles.ratingText}>
          {rating.toFixed(1)} ({reviewCount})
        </Text>
      </View>
      {visitCount !== undefined && (
        <View style={styles.visitContainer}>
          <Text style={styles.visitText}>{visitCount} визита</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 9999,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  ratingText: {
    ...typography.small,
    fontWeight: '600',
    color: colors.heading,
    marginLeft: spacing.xs,
  },
  visitContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 9999,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  visitText: {
    ...typography.small,
    color: colors.heading,
  },
});
