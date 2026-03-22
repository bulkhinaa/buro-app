import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  Dimensions,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import type { PhotoReport, Stage } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

type PhotoFilter = 'all' | 'before' | 'after';

interface PhotoGalleryProps {
  stages: Stage[];
  /** Map of stageId → PhotoReport[] */
  photosByStage: Record<string, PhotoReport[]>;
}

export function PhotoGallery({ stages, photosByStage }: PhotoGalleryProps) {
  const [filter, setFilter] = useState<PhotoFilter>('all');
  const [fullscreenPhoto, setFullscreenPhoto] = useState<PhotoReport | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  // Collect all photos
  const allPhotos: (PhotoReport & { stageTitle: string; stageIndex: number })[] = [];
  stages.forEach((stage) => {
    const photos = photosByStage[stage.id] || [];
    photos.forEach((photo) => {
      allPhotos.push({ ...photo, stageTitle: stage.title, stageIndex: stage.order_index });
    });
  });

  const totalCount = allPhotos.length;

  if (totalCount === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color={colors.border} />
        <Text style={styles.emptyText}>Фото пока нет</Text>
        <Text style={styles.emptySubtext}>
          Фотоотчёты появятся по мере выполнения этапов
        </Text>
      </View>
    );
  }

  // Stages that have photos
  const stagesWithPhotos = stages.filter(
    (s) => (photosByStage[s.id] || []).length > 0,
  );

  return (
    <View style={styles.container}>
      {/* Filter row */}
      <View style={styles.filterRow}>
        {(['all', 'before', 'after'] as PhotoFilter[]).map((f) => {
          const labels: Record<PhotoFilter, string> = {
            all: `Все (${totalCount})`,
            before: 'До',
            after: 'После',
          };
          const isActive = filter === f;
          return (
            <Pressable
              key={f}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {labels[f]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Photos grouped by stage */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {stagesWithPhotos.map((stage) => {
          const photos = photosByStage[stage.id] || [];
          if (photos.length === 0) return null;

          const isExpanded = expandedStage === stage.id || stagesWithPhotos.length <= 3;

          return (
            <View key={stage.id} style={styles.stageGroup}>
              <Pressable
                style={styles.stageHeader}
                onPress={() =>
                  setExpandedStage(expandedStage === stage.id ? null : stage.id)
                }
              >
                <View style={styles.stageNumberCircle}>
                  <Text style={styles.stageNumber}>{stage.order_index}</Text>
                </View>
                <Text style={styles.stageTitle}>{stage.title}</Text>
                <Text style={styles.photoCount}>{photos.length} фото</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textLight}
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.photoGrid}>
                  {photos.map((photo) => (
                    <Pressable
                      key={photo.id}
                      style={styles.thumbContainer}
                      onPress={() => setFullscreenPhoto(photo)}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.thumb}
                        resizeMode="cover"
                      />
                      {photo.comment && (
                        <View style={styles.thumbOverlay}>
                          <Ionicons
                            name="chatbubble-outline"
                            size={10}
                            color={colors.white}
                          />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Fullscreen modal */}
      <Modal
        visible={!!fullscreenPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <Pressable
            style={styles.fullscreenClose}
            onPress={() => setFullscreenPhoto(null)}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </Pressable>

          {fullscreenPhoto && (
            <View style={styles.fullscreenContent}>
              <Image
                source={{ uri: fullscreenPhoto.url }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              {fullscreenPhoto.comment && (
                <View style={styles.fullscreenCaption}>
                  <Text style={styles.fullscreenCaptionText}>
                    {fullscreenPhoto.comment}
                  </Text>
                  <Text style={styles.fullscreenDate}>
                    {new Date(fullscreenPhoto.created_at).toLocaleDateString(
                      'ru-RU',
                      { day: 'numeric', month: 'long', year: 'numeric' },
                    )}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  emptySubtext: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  stageGroup: {
    marginBottom: spacing.lg,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stageNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  stageTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    flex: 1,
  },
  photoCount: {
    ...typography.caption,
    color: colors.textLight,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumbContainer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fullscreen
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenContent: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  fullscreenCaption: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fullscreenCaptionText: {
    ...typography.body,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  fullscreenDate: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
});
