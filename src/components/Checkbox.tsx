import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  indeterminate?: boolean;
  disabled?: boolean;
  error?: boolean;
  size?: number;
}

export function Checkbox({
  checked,
  onPress,
  label,
  indeterminate = false,
  disabled = false,
  error = false,
  size = 24,
}: CheckboxProps) {
  const isActive = checked || indeterminate;
  const bgColor = error
    ? colors.danger
    : isActive
      ? colors.primary
      : colors.transparent;
  const borderColor = error
    ? colors.danger
    : isActive
      ? colors.primary
      : colors.textLight;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
      hitSlop={8}
    >
      <View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: 6,
            backgroundColor: bgColor,
            borderColor,
          },
        ]}
      >
        {checked && !indeterminate && (
          <Ionicons name="checkmark" size={size * 0.7} color={colors.white} />
        )}
        {indeterminate && (
          <Ionicons name="remove" size={size * 0.7} color={colors.white} />
        )}
      </View>
      {label && <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  box: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.body,
    color: colors.heading,
    marginLeft: spacing.sm,
  },
  labelDisabled: {
    color: colors.textLight,
  },
});
