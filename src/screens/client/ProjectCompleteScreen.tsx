import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, CellIndicator } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

export function ProjectCompleteScreen({ navigation, route }: Props) {
  const {
    area = '54 м²',
    cost = '870 000 ₽',
    duration = '45 дней',
    stagesTotal = 14,
  } = route.params || {};

  return (
    <ScreenWrapper>
      <View style={styles.center}>
        <Ionicons name="trophy-outline" size={80} color={colors.primary} style={{ marginBottom: spacing.xxl }} />
        <Text style={styles.title}>Поздравляем!</Text>
        <Text style={styles.subtitle}>Ваш ремонт завершён</Text>

        <Card style={styles.summaryCard}>
          <CellIndicator variant="row" label="Площадь" value={area} />
          <CellIndicator variant="row" label="Стоимость" value={cost} />
          <CellIndicator variant="row" label="Срок" value={duration} />
          <CellIndicator
            variant="row"
            label="Этапов завершено"
            value={`${stagesTotal} из ${stagesTotal}`}
          />
        </Card>

        <Button
          title="На главную"
          onPress={() => navigation.popToTop()}
          fullWidth
          style={{ marginTop: spacing.xxl }}
        />
        <Button
          title="Начать новый проект"
          onPress={() => {
            navigation.popToTop();
            navigation.navigate('CreateProject');
          }}
          variant="outline"
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.huge,
  },
  // emoji style removed — now using Ionicons inline
  title: {
    ...typography.h1,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  summaryCard: {
    width: '100%',
  },
});
