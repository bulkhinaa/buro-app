import React, { useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Input } from './Input';
import { colors, typography } from '../theme';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (digits: string) => void;
  error?: string;
  placeholder?: string;
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
}

function extractDigits(text: string): string {
  return text.replace(/\D/g, '').slice(0, 10);
}

export function PhoneInput({
  label,
  value,
  onChangeText,
  error,
  placeholder = '999 999-99-99',
}: PhoneInputProps) {
  const formatted = formatPhone(value);

  const handleChange = useCallback(
    (text: string) => {
      const digits = extractDigits(text);
      onChangeText(digits);
    },
    [onChangeText],
  );

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const prefix = <Text style={styles.prefix}>+7</Text>;

  return (
    <Input
      label={label}
      value={formatted}
      onChangeText={handleChange}
      onClear={handleClear}
      error={error}
      placeholder={placeholder}
      keyboardType="phone-pad"
      leftIcon={prefix}
      clearable
    />
  );
}

const styles = StyleSheet.create({
  prefix: {
    ...typography.body,
    color: colors.heading,
    fontWeight: '500',
  },
});
