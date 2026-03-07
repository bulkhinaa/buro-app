import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

interface CellIndicatorRowProps {
  variant: 'row';
  label: string;
  value: string;
  valueColor?: string;
}

interface CellIndicatorCardProps {
  variant: 'card';
  icon?: React.ReactNode;
  name: string;
  value?: string;
  valueColor?: string;
  showChevron?: boolean;
  onPress?: () => void;
}

type CellIndicatorProps = CellIndicatorRowProps | CellIndicatorCardProps;

export function CellIndicator(props: CellIndicatorProps) {
  if (props.variant === 'row') {
    return (
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{props.label}</Text>
        <Text style={[styles.rowValue, props.valueColor ? { color: props.valueColor } : undefined]}>
          {props.value}
        </Text>
      </View>
    );
  }

  const content = (
    <View style={styles.card}>
      {props.icon && <View style={styles.cardIcon}>{props.icon}</View>}
      <Text style={styles.cardName} numberOfLines={1}>{props.name}</Text>
      {props.value && (
        <Text
          style={[styles.cardValue, props.valueColor ? { color: props.valueColor } : undefined]}
          numberOfLines={1}
        >
          {props.value}
        </Text>
      )}
      {props.showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      )}
    </View>
  );

  if (props.onPress) {
    return (
      <Pressable
        onPress={props.onPress}
        style={({ pressed }) => pressed && styles.cardPressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text,
  },
  rowValue: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardIcon: {
    marginRight: spacing.md,
  },
  cardName: {
    ...typography.body,
    color: colors.heading,
    flex: 1,
  },
  cardValue: {
    ...typography.bodyBold,
    color: colors.heading,
    marginRight: spacing.sm,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
