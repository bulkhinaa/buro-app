import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components';
import { colors, spacing, typography } from '../../theme';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = 'hasSeenOnboarding';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'home',
    title: 'Ремонт без стресса',
    subtitle:
      'Мы берём на себя контроль за каждым этапом — от демонтажа до финальной уборки',
  },
  {
    id: '2',
    icon: 'shield-checkmark',
    title: 'Независимый контроль',
    subtitle:
      'На каждом объекте работает супервайзер — он проверяет качество и принимает работы за вас',
  },
  {
    id: '3',
    icon: 'eye',
    title: 'Прозрачность на каждом шагу',
    subtitle:
      'Вы видите прогресс ремонта в реальном времени: фотоотчёты, этапы, сроки и расходы',
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
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={48} color={colors.primary} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
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
      />

      <View style={styles.footer}>
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
          style={{ marginTop: spacing.xxl }}
        />
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
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
});
