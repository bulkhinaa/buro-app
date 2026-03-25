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
import { useTheme } from '../../theme/ThemeContext';
import { hapticLight } from '../../utils/haptics';

interface SlideConfig {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  pain: string;
  solution: string;
}

const SLIDES: SlideConfig[] = [
  {
    id: '1',
    icon: 'eye-outline',
    title: 'Контроль качества',
    pain: 'Заказчики не могут оценить качество работ',
    solution: 'Вы — независимый эксперт, который проверяет каждый этап и защищает интересы клиента',
  },
  {
    id: '2',
    icon: 'clipboard-outline',
    title: 'Управление этапами',
    pain: 'Мастера не всегда следуют плану',
    solution: 'Создавайте план этапов, назначайте мастеров и контролируйте сроки через приложение',
  },
  {
    id: '3',
    icon: 'cash-outline',
    title: 'Стабильный доход',
    pain: 'Сложно найти постоянные заказы',
    solution: 'Платформа приводит клиентов — вы получаете вознаграждение за каждый проект',
  },
  {
    id: '4',
    icon: 'shield-checkmark-outline',
    title: 'Репутация и рост',
    pain: 'Ваш опыт нигде не фиксируется',
    solution: 'Рейтинг, отзывы клиентов и портфолио проектов формируют вашу репутацию',
  },
];

type Props = {
  onComplete: () => void;
};

export function SupervisorWelcomeScreen({ onComplete }: Props) {
  const { colors: themeColors, glass, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  const goToSlide = useCallback((nextIndex: number) => {
    if (Platform.OS === 'web') {
      fadeAnim.setValue(0);
      setCurrentIndex(nextIndex);
      setTimeout(() => fadeAnim.setValue(1), 30);
      return;
    }
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
      onComplete();
    } else {
      goToSlide(currentIndex + 1);
      hapticLight();
    }
  }, [isLastSlide, currentIndex, onComplete, goToSlide]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <LinearGradient
      colors={[colors.bgGradientStart, colors.bgGradientMid, colors.bgGradientEnd]}
      style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
    >
      {/* Skip button */}
      <View style={styles.topRow}>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>Пропустить</Text>
        </Pressable>
      </View>

      {/* Slide content */}
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Ionicons name={slide.icon} size={48} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>{slide.title}</Text>

        <View style={styles.painCard}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.painText}>{slide.pain}</Text>
        </View>

        <View style={styles.solutionCard}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
          <Text style={styles.solutionText}>{slide.solution}</Text>
        </View>
      </Animated.View>

      {/* Bottom: dots + button */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {isLastSlide ? 'Начать' : 'Далее'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={colors.white}
          />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  topRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.xxl,
  },
  skipText: {
    ...typography.body,
    color: colors.textLight,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  painCard: {
    flexDirection: 'row',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  painText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  solutionCard: {
    flexDirection: 'row',
    backgroundColor: colors.successLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  solutionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  bottom: {
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
  },
  nextBtnText: {
    ...typography.bodyBold,
    color: colors.white,
    fontSize: 16,
  },
});
