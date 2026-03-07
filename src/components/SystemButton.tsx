import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

type SystemButtonType = 'back' | 'close' | 'more';

interface SystemButtonProps {
  type: SystemButtonType;
  onPress: () => void;
  size?: number;
}

const ICON_MAP: Record<SystemButtonType, keyof typeof Ionicons.glyphMap> = {
  back: 'chevron-back',
  close: 'close',
  more: 'ellipsis-vertical',
};

export function SystemButton({
  type,
  onPress,
  size = 40,
}: SystemButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        pressed && styles.pressed,
      ]}
      hitSlop={4}
    >
      <Ionicons
        name={ICON_MAP[type]}
        size={size * 0.5}
        color={colors.heading}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
