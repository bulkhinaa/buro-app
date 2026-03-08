import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components';
import { colors, spacing, typography } from '../../theme';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = 'hasSeenOnboarding';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'home',
    title: 'Ремонт без стресса',
    subtitle:
      'Мы берём на себя контроль за каждым этапом —\nот демонтажа до финальной уборки',
    image: require('../../../assets/images/onboarding/slide1.jpg'),
  },
  {
    id: '2',
    icon: 'shield-checkmark',
    title: 'Независимый контроль',
    subtitle:
      'На каждом объекте работает супервайзер —\nон проверяет качество и принимает работы за вас',
    image: require('../../../assets/images/onboarding/slide2.jpg'),
  },
  {
    id: '3',
    icon: 'eye',
    title: 'Прозрачность\nна каждом шагу',
    subtitle:
      'Вы видите прогресс ремонта в реальном времени:\nфотоотчёты, этапы, сроки и расходы',
    image: require('../../../assets/images/onboarding/slide3.jpg'),
  },
];

type Props = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  const getItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      {/* Background image */}
      <Image source={item.image} style={styles.bgImage} resizeMode="cover" />

      {/* Dark gradient overlay — bottom heavy for text readability */}
      <LinearGradient
        colors={[
          'rgba(10, 5, 16, 0.1)',
          'rgba(10, 5, 16, 0.3)',
          'rgba(10, 5, 16, 0.75)',
          'rgba(10, 5, 16, 0.92)',
        ]}
        locations={[0, 0.35, 0.6, 0.85]}
        style={styles.overlay}
      />

      {/* Content positioned at bottom */}
      <View style={styles.slideContent}>
        <View style={styles.iconPill}>
          <Ionicons name={item.icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        bounces={false}
        style={{ flex: 1 }}
      />

      {/* Footer with dots + button, overlaid on top */}
      <SafeAreaView style={styles.footerSafe} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.footer} pointerEvents="box-none">
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Button
            title={isLast ? 'Начать' : 'Далее →'}
            onPress={handleNext}
            fullWidth
            style={{ marginTop: spacing.xl }}
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
    backgroundColor: '#0A0510',
  },
  slide: {
    width,
    height,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContent: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 45, 62, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.md,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.75)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
});
