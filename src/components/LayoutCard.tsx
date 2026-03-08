import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

interface LayoutCardProps {
  svg?: string;
  name: string;
  description?: string;
  areaRange?: string;
  selected?: boolean;
  onPress?: () => void;
  isCustom?: boolean;
  badge?: string;
}

export function LayoutCard({
  svg,
  name,
  description,
  areaRange,
  selected = false,
  onPress,
  isCustom = false,
  badge,
}: LayoutCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      {isCustom ? (
        <View style={styles.customIcon}>
          <Ionicons name="camera-outline" size={36} color={colors.textLight} />
        </View>
      ) : svg ? (
        <View style={styles.svgContainer}>
          <SvgXml xml={svg} width={130} height={130} />
        </View>
      ) : null}

      <Text
        style={[styles.name, selected && styles.nameSelected]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {description && (
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      )}

      {areaRange && (
        <Text style={styles.area}>{areaRange}</Text>
      )}

      {selected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

/**
 * Compact layout card for use in object detail and home screen.
 */
export function LayoutCardMini({
  svg,
  name,
  onPress,
}: {
  svg?: string;
  name?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.miniCard}>
      {svg ? (
        <SvgXml xml={svg} width={70} height={70} />
      ) : (
        <Ionicons name="home-outline" size={32} color={colors.textLight} />
      )}
      {name && (
        <Text style={styles.miniName} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.md,
    alignItems: 'center',
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardPressed: {
    opacity: 0.85,
  },
  svgContainer: {
    width: 130,
    height: 130,
    marginBottom: spacing.sm,
  },
  customIcon: {
    width: 130,
    height: 130,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.bodyBold,
    color: colors.heading,
    textAlign: 'center',
  },
  nameSelected: {
    color: colors.primary,
  },
  description: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  area: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    zIndex: 1,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  // Mini card styles
  miniCard: {
    width: 80,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xs,
  },
  miniName: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
});
