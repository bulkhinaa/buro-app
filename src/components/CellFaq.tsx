import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

interface CellFaqProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export function CellFaq({
  question,
  answer,
  defaultOpen = false,
}: CellFaqProps) {
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 180 : 0);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 250 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.card}>
      <Pressable onPress={toggleOpen} style={styles.header}>
        <Text style={styles.question}>{question}</Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </Animated.View>
      </Pressable>
      {open && (
        <Text style={styles.answer}>{answer}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
    marginRight: spacing.md,
  },
  answer: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    lineHeight: 22,
  },
});
