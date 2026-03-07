import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface RadioButtonProps {
  selected: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  size?: number;
}

export function RadioButton({
  selected,
  onPress,
  label,
  disabled = false,
  error = false,
  size = 24,
}: RadioButtonProps) {
  const borderColor = error
    ? colors.danger
    : selected
      ? colors.primary
      : colors.textLight;

  const dotColor = error ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
      hitSlop={8}
    >
      <View
        style={[
          styles.outer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
          },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.inner,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: size * 0.25,
                backgroundColor: dotColor,
              },
            ]}
          />
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
  outer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {},
  label: {
    ...typography.body,
    color: colors.heading,
    marginLeft: spacing.sm,
  },
  labelDisabled: {
    color: colors.textLight,
  },
});
