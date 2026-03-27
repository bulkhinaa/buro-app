import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  ImageSourcePropType,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components';
import { colors, spacing } from '../../theme';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = 'hasSeenOnboarding';

/** Warm cream background matching the 3D illustration style */
const BG_CREAM = '#F5EFE9';

/**
 * Illustration occupies the top ~62% of the screen, stretching edge-to-edge.
 * Text block sits at the bottom ~38%, overlapping the illustration tail
 * for a natural layered feel.
 */
const ILLUSTRATION_HEIGHT = height * 0.62;

interface SlideConfig {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  image: ImageSourcePropType;
}

const SLIDE_CONFIGS: SlideConfig[] = [
  {
    id: '1',
    icon: 'home',
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    image: require('../../../assets/images/onboarding/slide1.png'),
  },
  {
    id: '2',
    icon: 'shield-checkmark',
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    image: require('../../../assets/images/onboarding/slide2.png'),
  },
  {
    id: '3',
    icon: 'eye',
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    image: require('../../../assets/images/onboarding/slide3.png'),
  },
];

type Props = {
  onComplete: () => void;
  onBack?: () => void;
};

export function OnboardingScreen({ onComplete, onBack }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const { t } = useTranslation();

  // Fix: RN Web Image sets internal opacity:0 for its loading fade-in.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = `
      [data-testid="onboarding-slides"] img {
        opacity: 1 !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const isLast = activeIndex === SLIDE_CONFIGS.length - 1;

  // Track active slide from scroll position (works on web and native)
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index >= 0 && index < SLIDE_CONFIGS.length) {
      setActiveIndex(index);
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    const targetX = index * width;

    if (Platform.OS === 'web') {
      // Web: use DOM scrollTo which is more reliable than RN scrollTo
      const scrollNode = (scrollRef.current as any)?.getScrollableNode?.() ||
        (scrollRef.current as any)?._nativeRef?.current;
      if (scrollNode) {
        scrollNode.scrollTo({ left: targetX, behavior: 'smooth' });
      } else {
        // Fallback: try RN scrollTo
        scrollRef.current?.scrollTo({ x: targetX, animated: true });
      }
    } else {
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
    }

    // Update index immediately for responsive UI
    setActiveIndex(index);

    setTimeout(() => {
      isScrolling.current = false;
    }, 400);
  }, []);

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } else {
      scrollToIndex(activeIndex + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const renderSlide = (item: SlideConfig) => (
    <View style={styles.slide}>
      {/* 3D illustration — fills upper portion, edge to edge */}
      <Image
        source={item.image}
        style={styles.illustration}
        resizeMode="contain"
      />

      {/* Text content — anchored at bottom, gradient fade over illustration */}
      <LinearGradient
        colors={['transparent', BG_CREAM, BG_CREAM]}
        locations={[0, 0.25, 1]}
        style={styles.slideContent}
      >
        <View style={styles.iconPill}>
          <Ionicons name={item.icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.subtitle}>{t(item.subtitleKey)}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back button — top left (only on first slide if onBack is provided) */}
      {onBack && activeIndex === 0 && (
        <SafeAreaView style={styles.backSafe} edges={['top']} pointerEvents="box-none">
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </Pressable>
        </SafeAreaView>
      )}

      {/* Skip button — top right */}
      {!isLast && (
        <SafeAreaView style={styles.skipSafe} edges={['top']} pointerEvents="box-none">
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('onboarding.skip', 'Пропустить')}</Text>
          </Pressable>
        </SafeAreaView>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
        style={{ flex: 1 }}
        testID="onboarding-slides"
      >
        {SLIDE_CONFIGS.map((item) => renderSlide(item))}
      </ScrollView>

      {/* Footer with dots + button */}
      <SafeAreaView style={styles.footerSafe} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.footer} pointerEvents="box-none">
          <View style={styles.dots}>
            {SLIDE_CONFIGS.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => scrollToIndex(i)}
                hitSlop={8}
              >
                <View
                  style={[styles.dot, i === activeIndex && styles.dotActive]}
                />
              </Pressable>
            ))}
          </View>

          <Button
            title={isLast ? t('onboarding.start') : t('common.next')}
            onPress={handleNext}
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

export { ONBOARDING_KEY };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_CREAM,
  },
  backSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    marginTop: spacing.md,
  },
  skipSafe: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
  },
  slide: {
    width,
    height,
    backgroundColor: BG_CREAM,
  },
  illustration: {
    position: 'absolute',
    top: 20,
    left: -width * 0.04,
    width: width * 1.08,
    height: ILLUSTRATION_HEIGHT,
  },
  slideContent: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    width,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.heading,
    marginBottom: spacing.sm,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textLight,
    lineHeight: 24,
  },
  footerSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
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
    backgroundColor: 'rgba(123, 45, 62, 0.2)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
});
