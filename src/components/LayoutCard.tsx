import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, glass } from '../theme';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors, glass, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? glass.fill.regular : 'rgba(255, 255, 255, 0.6)',
          borderColor: isDark ? glass.border.regular : 'rgba(255, 255, 255, 0.85)',
          shadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(123, 45, 62, 0.06)',
        },
        selected && {
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        pressed && styles.cardPressed,
      ]}
    >
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>{badge}</Text>
        </View>
      )}

      {isCustom ? (
        <View style={[styles.customIcon, { borderColor: colors.border }]}>
          <Ionicons name="camera-outline" size={36} color={colors.textLight} />
        </View>
      ) : svg ? (
        <View style={styles.svgContainer}>
          <SvgXml xml={svg} width={130} height={130} />
        </View>
      ) : null}

      <Text
        style={[styles.name, { color: colors.heading }, selected && { color: colors.primary }]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {description && (
        <Text style={[styles.description, { color: colors.textLight }]} numberOfLines={1}>
          {description}
        </Text>
      )}

      {areaRange && (
        <Text style={[styles.area, { color: colors.textLight }]}>{areaRange}</Text>
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
  const { colors, glass, isDark } = useTheme();

  const content = (
    <View
      style={[
        styles.miniCard,
        {
          backgroundColor: isDark ? glass.fill.regular : 'rgba(255, 255, 255, 0.5)',
          borderColor: isDark ? glass.border.regular : 'rgba(255, 255, 255, 0.85)',
        },
      ]}
    >
      {svg ? (
        <SvgXml xml={svg} width={70} height={70} />
      ) : (
        <Ionicons name="home-outline" size={32} color={colors.textLight} />
      )}
      {name && (
        <Text style={[styles.miniName, { color: colors.textLight }]} numberOfLines={1}>
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
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
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
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.bodyBold,
    textAlign: 'center',
  },
  description: {
    ...typography.small,
    textAlign: 'center',
    marginTop: 2,
  },
  area: {
    ...typography.caption,
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
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    zIndex: 1,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  // Mini card styles
  miniCard: {
    width: 80,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xs,
  },
  miniName: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
});
