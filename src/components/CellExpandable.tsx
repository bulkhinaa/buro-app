import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

interface CellExpandableProps {
  text: string;
  actionType: 'add' | 'remove';
  onPress: () => void;
}

export function CellExpandable({
  text,
  actionType,
  onPress,
}: CellExpandableProps) {
  const isAdd = actionType === 'add';
  const iconName = isAdd ? 'add' : 'remove';
  const btnColor = isAdd ? colors.primary : colors.danger;
  const btnBg = isAdd ? colors.primaryLight : colors.dangerLight;

  return (
    <View style={styles.cell}>
      <Text style={styles.text} numberOfLines={2}>{text}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: btnBg },
          pressed && styles.actionPressed,
        ]}
        hitSlop={4}
      >
        <Ionicons name={iconName} size={18} color={btnColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.heading,
    flex: 1,
    marginRight: spacing.md,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPressed: {
    opacity: 0.7,
  },
});
