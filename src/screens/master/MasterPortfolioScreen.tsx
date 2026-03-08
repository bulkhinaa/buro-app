import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button, Card, AppDialog } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useMasterStore } from '../../store/masterStore';
import { useToastStore } from '../../store/toastStore';
import { hapticSuccess } from '../../utils/haptics';
import type { PortfolioProject } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing.md;
const CARD_PADDING = spacing.xl;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export function MasterPortfolioScreen({ navigation }: any) {
  const profile = useMasterStore((s) => s.profile);
  const removePortfolioProject = useMasterStore((s) => s.removePortfolioProject);
  const showToast = useToastStore((s) => s.show);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const portfolio = profile?.portfolio || [];

  const handleDelete = async () => {
    if (!deleteId) return;
    await removePortfolioProject(deleteId);
    hapticSuccess();
    showToast('Проект удалён', 'success');
    setDeleteId(null);
  };

  const renderItem = ({ item }: { item: PortfolioProject }) => {
    const hasPhoto = item.photos.length > 0;
    return (
      <Pressable
        onPress={() => navigation.navigate('MasterPortfolioEdit', { projectId: item.id })}
        style={styles.cardWrapper}
      >
        <Card style={styles.projectCard}>
          {hasPhoto ? (
            <Image source={{ uri: item.photos[0] }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={colors.textLight} />
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(item.created_at).toLocaleDateString('ru-RU')}
            </Text>
          </View>
          <Pressable
            style={styles.deleteButton}
            onPress={() => setDeleteId(item.id)}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color={colors.danger} />
          </Pressable>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Моё портфолио</Text>
        <Text style={styles.subtitle}>
          {portfolio.length > 0
            ? `${portfolio.length} ${portfolio.length === 1 ? 'проект' : portfolio.length < 5 ? 'проекта' : 'проектов'}`
            : 'Покажите свои лучшие работы'}
        </Text>
      </View>

      {portfolio.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>У вас пока нет проектов</Text>
          <Text style={styles.emptySubtitle}>
            Добавьте фото выполненных работ, чтобы привлечь больше заказов
          </Text>
          <Button
            title="Добавить проект"
            onPress={() => navigation.navigate('MasterPortfolioEdit')}
            icon={<Ionicons name="add" size={20} color={colors.white} />}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      ) : (
        <FlatList
          data={portfolio}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {portfolio.length > 0 && (
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('MasterPortfolioEdit')}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      )}

      {/* Delete confirmation */}
      <AppDialog
        visible={!!deleteId}
        title="Удалить проект?"
        message="Проект будет удалён из вашего портфолио"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
  },
  row: {
    gap: CARD_GAP,
  },
  listContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: CARD_GAP,
  },
  projectCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textLight,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.heading,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
