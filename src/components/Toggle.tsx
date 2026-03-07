import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../theme';

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_MARGIN = 2;

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  label,
}: ToggleProps) {
  const translateX = useSharedValue(value ? TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2 : 0);

  React.useEffect(() => {
    translateX.value = withTiming(
      value ? TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2 : 0,
      { duration: 200 },
    );
  }, [value, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[styles.container, disabled && styles.disabled]}
      hitSlop={8}
    >
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.track,
          { backgroundColor: value ? colors.primary : '#E5E5E5' },
        ]}
      >
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.body,
    color: colors.heading,
    marginRight: spacing.sm,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_MARGIN,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
