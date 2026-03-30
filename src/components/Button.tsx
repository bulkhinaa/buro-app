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
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

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
  accessibilityLabel?: string;
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
  accessibilityLabel,
}: ButtonProps) {
  const { isDark, colors } = useTheme();
  const isDisabled = disabled || loading;

  const gradientEnd = isDark ? '#A63D58' : '#9B4D5E';

  const buttonStyle = [
    styles.base,
    styles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    variant === 'outline' && [styles.outline, { borderColor: colors.primary }],
    variant === 'ghost' && styles.ghost,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${size}`],
    variant === 'outline' && { color: colors.primary },
    variant === 'ghost' && { color: colors.primary },
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
        <View style={[styles.badge, variant !== 'primary' && { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.badgeText, variant !== 'primary' && { color: colors.primary }]}>
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
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={[colors.primary, gradientEnd]}
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
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
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    ...typography.button,
    color: '#ffffff',
  },
  text_sm: { fontSize: 14 },
  text_md: { fontSize: 16 },
  text_lg: { fontSize: 17 },
  badge: {
    marginLeft: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.small,
    color: '#ffffff',
  },
});
