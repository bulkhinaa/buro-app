import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { Checkbox } from './Checkbox';
import { RadioButton } from './RadioButton';

interface CellServiceProps {
  icon?: React.ReactNode;
  category: string;
  name?: string;
  price?: string;
  selected?: boolean;
  selectionType?: 'checkbox' | 'radio';
  onPress?: () => void;
}

export function CellService({
  icon,
  category,
  name,
  price,
  selected = false,
  selectionType = 'checkbox',
  onPress,
}: CellServiceProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <View style={styles.textContainer}>
        {name ? (
          <>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {price && <Text style={styles.price}>{price}</Text>}
          </>
        ) : (
          <Text style={styles.category} numberOfLines={1}>{category}</Text>
        )}
      </View>
      {selectionType === 'checkbox' ? (
        <Checkbox checked={selected} onPress={onPress || (() => {})} size={20} />
      ) : (
        <RadioButton selected={selected} onPress={onPress || (() => {})} size={20} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.bgCard,
  },
  icon: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  category: {
    ...typography.body,
    color: colors.heading,
  },
  name: {
    ...typography.body,
    color: colors.heading,
  },
  price: {
    ...typography.bodyBold,
    color: colors.heading,
    marginTop: 2,
  },
});
