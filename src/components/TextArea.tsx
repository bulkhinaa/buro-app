import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Platform } from 'react-native';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && showLabel && (
        <Text style={[styles.label, { color: colors.heading }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          webInputReset,
          {
            minHeight,
            backgroundColor: colors.bgInput,
            color: colors.heading,
          },
          focused && styles.inputFocused,
          error ? { borderWidth: 1.5, borderColor: colors.danger } : undefined,
          style,
        ]}
        placeholderTextColor={colors.textLight}
        multiline
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.smallBold,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radius.lg,
    borderWidth: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  inputFocused: {
    // No border on focus — clean look
  },
  error: {
    ...typography.small,
    marginTop: spacing.xs,
  },
});
