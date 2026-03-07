import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface CellPaymentProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  amount: string;
  amountType?: 'positive' | 'neutral';
  onPress?: () => void;
}

export function CellPayment({
  icon,
  title,
  subtitle,
  amount,
  amountType = 'neutral',
  onPress,
}: CellPaymentProps) {
  const amountColor = amountType === 'positive' ? colors.success : colors.heading;

  const content = (
    <View style={styles.cell}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>{amount}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.body,
    color: colors.heading,
  },
  subtitle: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 2,
  },
  amount: {
    ...typography.bodyBold,
  },
  pressed: {
    opacity: 0.7,
  },
});
