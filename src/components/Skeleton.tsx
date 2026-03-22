import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius } from '../theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width="100%" height={140} borderRadius={radius.lg} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bgElevated,
  },
  card: {
    gap: 12,
  },
  cardContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
});
