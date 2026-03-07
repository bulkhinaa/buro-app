import React, { useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Input } from './Input';
import { colors } from '../theme';

interface DateTimeInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  mode?: 'date' | 'time';
}

const DATE_MASK = '__.__.__';
const TIME_MASK = '__:__';

function applyDateMask(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 6);
  if (d.length === 0) return '';
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}

function applyTimeMask(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 4);
  if (d.length === 0) return '';
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function extractDigits(text: string): string {
  return text.replace(/\D/g, '');
}

export function DateTimeInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  mode = 'date',
}: DateTimeInputProps) {
  const maskFn = mode === 'time' ? applyTimeMask : applyDateMask;
  const defaultPlaceholder = mode === 'time' ? TIME_MASK : DATE_MASK;
  const maxDigits = mode === 'time' ? 4 : 6;

  const formatted = maskFn(value);

  const handleChange = useCallback(
    (text: string) => {
      const digits = extractDigits(text).slice(0, maxDigits);
      onChangeText(digits);
    },
    [onChangeText, maxDigits],
  );

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const calendarIcon = <Text style={styles.calendarIcon}>📅</Text>;

  return (
    <Input
      label={label}
      value={formatted}
      onChangeText={handleChange}
      onClear={handleClear}
      error={error}
      placeholder={placeholder || defaultPlaceholder}
      keyboardType="numeric"
      rightIcon={calendarIcon}
      clearable={false}
    />
  );
}

const styles = StyleSheet.create({
  calendarIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
});
