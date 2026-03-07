import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

type MarkerLevel = 'dot' | 'avatar' | 'tooltip';

interface LocationIndicatorMasterProps {
  level: MarkerLevel;
  avatarUri?: string;
  name?: string;
  rating?: number;
  reviewCount?: number;
}

export function LocationIndicatorMaster({
  level,
  avatarUri,
  name,
  rating,
  reviewCount,
}: LocationIndicatorMasterProps) {
  if (level === 'dot') {
    return <View style={styles.dot} />;
  }

  if (level === 'avatar') {
    return (
      <View style={styles.avatarPin}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color={colors.white} />
          </View>
        )}
        <View style={styles.pinPoint} />
      </View>
    );
  }

  // tooltip level
  return (
    <View style={styles.tooltipContainer}>
      <View style={styles.tooltipCard}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={[styles.avatarImage, styles.tooltipAvatarSize]} />
        ) : (
          <View style={[styles.avatarPlaceholder, styles.tooltipAvatarSize]}>
            <Ionicons name="person" size={16} color={colors.white} />
          </View>
        )}
        <View style={styles.tooltipInfo}>
          {name && <Text style={styles.tooltipName} numberOfLines={1}>{name}</Text>}
          {rating !== undefined && (
            <View style={styles.tooltipRating}>
              <Ionicons name="star" size={12} color={colors.primary} />
              <Text style={styles.tooltipRatingText}>
                {rating.toFixed(1)} {reviewCount !== undefined && `(${reviewCount})`}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.tooltipArrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  avatarPin: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipAvatarSize: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  pinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: colors.transparent,
    borderRightColor: colors.transparent,
    borderTopColor: colors.primary,
    marginTop: -1,
  },
  tooltipContainer: {
    alignItems: 'center',
  },
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipInfo: {
    marginLeft: spacing.sm,
  },
  tooltipName: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  tooltipRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tooltipRatingText: {
    ...typography.small,
    color: colors.heading,
    marginLeft: spacing.xs,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: colors.transparent,
    borderRightColor: colors.transparent,
    borderTopColor: colors.primary,
    marginTop: -1,
  },
});
