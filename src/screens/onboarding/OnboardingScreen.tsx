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
import { spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = 'hasSeenOnboarding';

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
  const { colors, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const { t } = useTranslation();

  /** Background color — cream for light, dark bg for dark theme */
  const bgColor = isDark ? colors.bg : '#F5EFE9';

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

    setActiveIndex(index);

    // On native, programmatically scroll the ScrollView
    if (Platform.OS !== 'web') {
      const targetX = index * width;
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
    }
    // On web, we render only the active slide via activeIndex — no scroll needed

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
    <View style={[styles.slide, { backgroundColor: bgColor }]}>
      {/* 3D illustration — fills upper portion, edge to edge */}
      <Image
        source={item.image}
        style={styles.illustration}
        resizeMode="contain"
      />

      {/* Text content — anchored at bottom, gradient fade over illustration */}
      <LinearGradient
        colors={['transparent', bgColor, bgColor]}
        locations={[0, 0.25, 1]}
        style={styles.slideContent}
      >
        <View style={[styles.iconPill, { backgroundColor: colors.primary }]}>
          <Ionicons name={item.icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: colors.heading }]}>{t(item.titleKey)}</Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>{t(item.subtitleKey)}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Skip button — top right */}
      {!isLast && (
        <SafeAreaView style={styles.skipSafe} edges={['top']} pointerEvents="box-none">
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textLight }]}>{t('onboarding.skip', 'Пропустить')}</Text>
          </Pressable>
        </SafeAreaView>
      )}

      {Platform.OS === 'web' ? (
        /* Web: render only the active slide — avoids ScrollView.scrollTo issues */
        <View style={{ flex: 1 }} testID="onboarding-slides">
          {renderSlide(SLIDE_CONFIGS[activeIndex])}
        </View>
      ) : (
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
      )}

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
                  style={[
                    styles.dot,
                    { backgroundColor: isDark ? 'rgba(232,87,122,0.2)' : 'rgba(123, 45, 62, 0.2)' },
                    i === activeIndex && [styles.dotActive, { backgroundColor: colors.primary }],
                  ]}
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
  },
  slide: {
    width,
    height,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing.sm,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
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
  },
  dotActive: {
    width: 24,
  },
});
