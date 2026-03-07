import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { DateCell } from './DateCell';

interface DateItem {
  day: number;
  weekday: string;
  weekend?: boolean;
}

interface DateSectionProps {
  month: string;
  dates: DateItem[];
  selectedDay?: number;
  onSelectDay: (day: number) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export function DateSection({
  month,
  dates,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: DateSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.month}>{month}</Text>
        <View style={styles.arrows}>
          {onPrevMonth && (
            <Pressable onPress={onPrevMonth} hitSlop={8} style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.heading} />
            </Pressable>
          )}
          {onNextMonth && (
            <Pressable onPress={onNextMonth} hitSlop={8} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.heading} />
            </Pressable>
          )}
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((d) => (
          <DateCell
            key={d.day}
            day={d.day}
            weekday={d.weekday}
            weekend={d.weekend}
            selected={d.day === selectedDay}
            onPress={() => onSelectDay(d.day)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  month: {
    ...typography.h3,
    color: colors.heading,
  },
  arrows: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  arrowBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingRight: spacing.lg,
  },
});
