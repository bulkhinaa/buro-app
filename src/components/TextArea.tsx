import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Platform } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

// Reset web outline on focused inputs
const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};

interface TextAreaProps extends Omit<TextInputProps, 'multiline'> {
  label?: string;
  showLabel?: boolean;
  error?: string;
  minHeight?: number;
}

export function TextArea({
  label,
  showLabel = false,
  error,
  minHeight = 120,
  style,
  ...props
}: TextAreaProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && showLabel && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          webInputReset,
          { minHeight },
          focused && styles.inputFocused,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={colors.textLight}
        multiline
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.smallBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    color: colors.heading,
    ...typography.body,
  },
  inputFocused: {
    // No border on focus — clean look
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
