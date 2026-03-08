import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  badge?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  badge,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    styles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${size}`],
    variant === 'outline' && styles.textOutline,
    variant === 'ghost' && styles.textGhost,
  ];

  const content = (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary}
          style={{ marginRight: spacing.sm }}
        />
      )}
      {icon && <View style={{ marginRight: spacing.sm }}>{icon}</View>}
      <Text style={textStyle}>{title}</Text>
      {badge && (
        <View style={[styles.badge, variant !== 'primary' && styles.badgeOutline]}>
          <Text style={[styles.badgeText, variant !== 'primary' && styles.badgeTextOutline]}>
            {badge}
          </Text>
        </View>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={[colors.primary, '#9B4D5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            styles[size],
            fullWidth && styles.fullWidth,
            isDisabled && styles.disabled,
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={buttonStyle}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
  },
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.transparent,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  text: {
    ...typography.button,
    color: colors.white,
  },
  text_sm: { fontSize: 14 },
  text_md: { fontSize: 16 },
  text_lg: { fontSize: 17 },
  textOutline: { color: colors.primary },
  textGhost: { color: colors.primary },
  badge: {
    marginLeft: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeOutline: {
    backgroundColor: colors.primaryLight,
  },
  badgeText: {
    ...typography.small,
    color: colors.white,
  },
  badgeTextOutline: {
    color: colors.primary,
  },
});
