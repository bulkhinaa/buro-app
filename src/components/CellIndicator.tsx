import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

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
  rightElement?: React.ReactNode;
}

type CellIndicatorProps = CellIndicatorRowProps | CellIndicatorCardProps;

export function CellIndicator(props: CellIndicatorProps) {
  const { isDark, colors } = useTheme();

  if (props.variant === 'row') {
    return (
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{props.label}</Text>
        <Text style={[styles.rowValue, { color: colors.heading }, props.valueColor ? { color: props.valueColor } : undefined]}>
          {props.value}
        </Text>
      </View>
    );
  }

  const cardBg = isDark ? colors.bgCard : colors.white;

  const content = (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      {props.icon && <View style={styles.cardIcon}>{props.icon}</View>}
      <Text style={[styles.cardName, { color: colors.heading }]} numberOfLines={1}>{props.name}</Text>
      {props.value && (
        <Text
          style={[styles.cardValue, { color: colors.heading }, props.valueColor ? { color: props.valueColor } : undefined]}
          numberOfLines={1}
        >
          {props.value}
        </Text>
      )}
      {props.rightElement}
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
  },
  rowLabel: {
    ...typography.body,
  },
  rowValue: {
    ...typography.bodyBold,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardIcon: {
    marginRight: spacing.md,
  },
  cardName: {
    ...typography.body,
    flex: 1,
  },
  cardValue: {
    ...typography.bodyBold,
    marginRight: spacing.sm,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
