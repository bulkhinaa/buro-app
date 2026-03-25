import React, { useState, ReactNode } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

// Reset web outline on focused inputs
const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};

interface InputProps extends TextInputProps {
  label?: string;
  showLabel?: boolean;
  error?: string;
  clearable?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClear?: () => void;
}

export function Input({
  label,
  showLabel = false,
  error,
  clearable = true,
  leftIcon,
  rightIcon,
  onClear,
  style,
  value,
  onChangeText,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const showClear = clearable && value && value.length > 0;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <View style={styles.container}>
      {label && showLabel && (
        <Text style={[styles.label, { color: colors.heading }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.bgInput },
          focused && {
            borderWidth: 1.5,
            borderColor: colors.primary,
            backgroundColor: colors.bgCard,
          },
          error ? { borderWidth: 1.5, borderColor: colors.danger } : undefined,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            webInputReset,
            { color: colors.heading },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            (showClear || rightIcon) ? styles.inputWithRightContent : undefined,
            style,
          ]}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {showClear && (
          <Pressable
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </Pressable>
        )}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 0,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightContent: {
    paddingRight: spacing.xs,
  },
  leftIcon: {
    paddingLeft: spacing.lg,
    justifyContent: 'center',
  },
  rightIcon: {
    paddingRight: spacing.md,
    justifyContent: 'center',
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  error: {
    ...typography.small,
    marginTop: spacing.xs,
  },
});
