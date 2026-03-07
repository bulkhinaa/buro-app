import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { TimeCell } from './TimeCell';

interface TimeSectionProps {
  title?: string;
  times: string[];
  selectedTime?: string;
  onSelectTime: (time: string) => void;
  columns?: number;
}

export function TimeSection({
  title = 'День',
  times,
  selectedTime,
  onSelectTime,
  columns = 4,
}: TimeSectionProps) {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.grid, { flexWrap: 'wrap' }]}>
        {times.map((t) => (
          <TimeCell
            key={t}
            time={t}
            selected={t === selectedTime}
            onPress={() => onSelectTime(t)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
  },
});
