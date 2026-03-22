import React from 'react';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface AnimatedEntryProps {
  children: React.ReactNode;
  index?: number;
  direction?: 'up' | 'down';
  delay?: number;
}

export function AnimatedEntry({
  children,
  index = 0,
  direction = 'down',
  delay = 0,
}: AnimatedEntryProps) {
  const baseDelay = delay + index * 80;
  const entering = direction === 'down'
    ? FadeInDown.delay(baseDelay).duration(400).springify()
    : FadeInUp.delay(baseDelay).duration(400).springify();

  return (
    <Animated.View entering={entering}>
      {children}
    </Animated.View>
  );
}
