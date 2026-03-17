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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
};

export function OnboardingScreen({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
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

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } else {
      const nextIndex = activeIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }
  };

  const renderSlide = (item: SlideConfig) => (
    <View style={styles.slide}>
      {/* 3D illustration — fills upper portion, edge to edge */}
      <Image
        source={item.image}
        style={styles.illustration}
        resizeMode="contain"
      />

      {/* Text content — anchored at bottom, overlaps illustration tail */}
      <View style={styles.slideContent}>
        <View style={styles.iconPill}>
          <Ionicons name={item.icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.subtitle}>{t(item.subtitleKey)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
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
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
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
