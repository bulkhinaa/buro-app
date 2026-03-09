import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';
import { useMasterStore } from '../../store/masterStore';
import { hapticLight } from '../../utils/haptics';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  pain: string;
  solution: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'briefcase-outline',
    title: 'Находите заказы\nбез посредников',
    pain: 'Устали искать клиентов через сарафанное радио?',
    solution: 'Получайте задачи напрямую от супервайзеров. Мы сами находим клиентов.',
  },
  {
    id: '2',
    icon: 'shield-checkmark-outline',
    title: 'Работайте легально —\nмы берём налоги на себя',
    pain: 'Не хотите разбираться с налогами и отчётностью?',
    solution: 'Зарегистрируйтесь как самозанятый прямо в приложении. Мы уплатим налоги за вас — вы получите чистые деньги на карту.',
  },
  {
    id: '3',
    icon: 'people-outline',
    title: 'Полная прозрачность —\nвзаимные оценки',
    pain: 'Боитесь столкнуться с недобросовестным заказчиком?',
    solution: 'У нас оценивают все: вы — супервайзера, супервайзер — вас и клиента, клиент — супервайзера. Рейтинг есть даже у клиентов. Всё честно и прозрачно.',
  },
  {
    id: '4',
    icon: 'star-outline',
    title: 'Стройте репутацию\nи зарабатывайте больше',
    pain: 'Нет возможности показать свой профессионализм?',
    solution: 'Портфолио, рейтинг, отзывы клиентов — всё работает на вашу репутацию. Лучшие мастера получают больше заказов.',
  },
];

type Props = {
  onComplete: () => void;
};

export function MasterWelcomeScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const markWelcomeSeen = useMasterStore((s) => s.markWelcomeSeen);

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  const goToSlide = useCallback((nextIndex: number) => {
    // Fade out → change slide → fade in
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      markWelcomeSeen();
      onComplete();
    } else {
      goToSlide(currentIndex + 1);
      hapticLight();
    }
  }, [isLastSlide, currentIndex, markWelcomeSeen, onComplete, goToSlide]);

  const handleSkip = useCallback(() => {
    markWelcomeSeen();
    onComplete();
  }, [markWelcomeSeen, onComplete]);

  return (
    <LinearGradient
      colors={[colors.bgGradientStart, colors.bgGradientMid, colors.bgGradientEnd]}
      locations={[0, 0.4, 1]}
      style={[styles.container, Platform.OS === 'web' ? ({ minHeight: '100dvh' } as any) : undefined]}
    >
      {/* Skip button */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        {!isLastSlide ? (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipText}>Пропустить</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Single slide with fade transition */}
      <Animated.View style={[styles.slideContainer, { opacity: fadeAnim }]}>
        <View style={styles.slide}>
          <View style={styles.iconCircle}>
            <Ionicons name={slide.icon} size={48} color={colors.primary} />
          </View>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <View style={styles.painCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.warning} style={{ marginRight: spacing.sm }} />
            <Text style={styles.painText}>{slide.pain}</Text>
          </View>
          <Text style={styles.solutionText}>{slide.solution}</Text>
        </View>
      </Animated.View>

      {/* Bottom area */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, spacing.xxl) }]}>
        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Action button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>
              {isLastSlide ? 'Начать регистрацию' : 'Далее'}
            </Text>
            <Ionicons
              name={isLastSlide ? 'arrow-forward' : 'chevron-forward'}
              size={20}
              color={colors.white}
            />
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
  },
  skipText: {
    ...typography.body,
    color: colors.textLight,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    paddingHorizontal: spacing.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(123, 45, 62, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  slideTitle: {
    ...typography.h1,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 36,
  },
  painCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    width: '100%',
  },
  painText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontStyle: 'italic',
  },
  solutionText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomArea: {
    paddingHorizontal: spacing.xxxl,
    gap: spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(123, 45, 62, 0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  actionButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
