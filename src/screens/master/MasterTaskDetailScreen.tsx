import React, { useState, useCallback } from 'react';
import { hapticSuccess } from '../../utils/haptics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ScreenWrapper,
  Button,
  Card,
  StatusBadge,
  AppDialog,
  MapPreview,
  TextArea,
} from '../../components';
import type { DialogButton } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useToastStore } from '../../store/toastStore';
import { useTaskStore } from '../../store/taskStore';
import { STAGE_STATUS_LABELS } from '../../types';

const MAX_PHOTOS = 5;

const webAbsoluteFill = Platform.OS === 'web'
  ? ({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any)
  : undefined;

type Props = {
  navigation: any;
  route: any;
};

export function MasterTaskDetailScreen({ navigation, route }: Props) {
  const task = route.params?.task;
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((s) => s.show);
  const { updateStatus, addPhoto, removePhoto, getPhotos, clearPhotos, tasks } = useTaskStore();

  // Get live status from store (falls back to route param)
  const liveTask = tasks.find((t) => t.id === task?.id);
  const status = liveTask?.status || task?.status || 'pending';

  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Photos from store
  const photos = task ? getPhotos(task.id) : [];

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const showDialog = (title: string, message: string, buttons: DialogButton[]) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogVisible(true);
  };

  const handlePickPhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      showToast(`Максимум ${MAX_PHOTOS} фото`, 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_PHOTOS - photos.length,
    });

    if (!result.canceled && result.assets) {
      for (const asset of result.assets) {
        if (photos.length + result.assets.indexOf(asset) < MAX_PHOTOS) {
          addPhoto(task.id, asset.uri);
        }
      }
      hapticSuccess();
    }
  }, [photos, task, addPhoto, showToast]);

  const handleRemovePhoto = useCallback((uri: string) => {
    removePhoto(task.id, uri);
  }, [task, removePhoto]);

  const handleStart = useCallback(() => {
    showDialog(
      'Начать работу?',
      `Задача: ${task?.title}\n${task?.projectTitle || ''}`,
      [
        {
          text: 'Начать',
          onPress: async () => {
            await updateStatus(task.id, 'in_progress');
            hapticSuccess();
            showToast('Работа начата', 'success');
          },
        },
        { text: 'Нет', style: 'cancel', onPress: () => {} },
      ],
    );
  }, [task, showToast, updateStatus]);

  const handleComplete = useCallback(() => {
    showDialog(
      'Отметить выполнение?',
      'Супервайзер проверит результат работы.',
      [
        {
          text: 'Выполнено',
          onPress: async () => {
            setSaving(true);
            await updateStatus(task.id, 'done_by_master');
            hapticSuccess();
            showToast('Задача отправлена на проверку', 'success');
            setSaving(false);
          },
        },
        { text: 'Нет', style: 'cancel', onPress: () => {} },
      ],
    );
  }, [task, showToast, updateStatus]);

  const handleRework = useCallback(() => {
    updateStatus(task.id, 'in_progress');
    clearPhotos(task.id);
    showToast('Продолжайте работу', 'info');
  }, [task, showToast, updateStatus, clearPhotos]);

  const handleChat = useCallback(() => {
    navigation.navigate('Chat', {
      projectId: task?.project_id,
      channelId: `stage_${task?.id}`,
    });
  }, [navigation, task]);

  if (!task) {
    return (
      <ScreenWrapper>
        <Text style={styles.errorText}>Задача не найдена</Text>
      </ScreenWrapper>
    );
  }

  const isRejected = status === 'rejected';
  const rejectionReason = task.rejection_reason || 'Причина не указана';

  return (
    <View style={[styles.container, webAbsoluteFill]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: 100 + insets.bottom },
        ]}
      >
        {/* Back button */}
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.heading} />
        </Pressable>

        {/* Status + deadline */}
        <View style={styles.statusRow}>
          <StatusBadge status={status} />
          {task.deadline && (
            <Text style={styles.deadline}>
              до {new Date(task.deadline).toLocaleDateString('ru-RU')}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.projectTitle}>{task.projectTitle}</Text>

        {/* Rejection card */}
        {isRejected && (
          <View style={styles.rejectionCard}>
            <Ionicons name="alert-circle" size={22} color={colors.danger} />
            <View style={styles.rejectionContent}>
              <Text style={styles.rejectionTitle}>Отклонено супервайзером</Text>
              <Text style={styles.rejectionReason}>{rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Address & map */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{task.address}</Text>
          </View>
          <MapPreview address={task.address} />
        </Card>

        {/* Deadline info */}
        {task.deadline && (
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Срок: {new Date(task.deadline).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {task.started_at && (
              <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                <Ionicons name="play-outline" size={18} color={colors.success} />
                <Text style={styles.infoText}>
                  Начато: {new Date(task.started_at).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Description / checklist */}
        {task.description && (
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.descriptionText}>{task.description}</Text>
          </Card>
        )}

        {/* Comment + Photo report for in-progress tasks */}
        {status === 'in_progress' && (
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Комментарий к работе</Text>
            <TextArea
              value={comment}
              onChangeText={setComment}
              placeholder="Опишите, что было сделано (необязательно)"
              maxLength={500}
            />

            {/* Photo report section */}
            <View style={styles.photoSection}>
              <View style={styles.photoHeader}>
                <Text style={styles.photoTitle}>
                  <Ionicons name="camera-outline" size={16} color={colors.heading} />{' '}
                  Фотоотчёт ({photos.length}/{MAX_PHOTOS})
                </Text>
              </View>

              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <View key={photo.uri} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                    <Pressable
                      style={styles.photoRemove}
                      onPress={() => handleRemovePhoto(photo.uri)}
                    >
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <Pressable style={styles.photoAdd} onPress={handlePickPhoto}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                    <Text style={styles.photoAddText}>Добавить</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Chat button */}
        <Pressable onPress={handleChat} style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.chatButtonText}>Написать супервайзеру</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {status === 'pending' && (
          <Button title="Начать работу" onPress={handleStart} fullWidth />
        )}
        {status === 'in_progress' && (
          <Button
            title={saving ? 'Отправляем...' : 'Завершить этап'}
            onPress={handleComplete}
            loading={saving}
            fullWidth
          />
        )}
        {status === 'rejected' && (
          <Button title="Доработать" onPress={handleRework} fullWidth />
        )}
        {status === 'done_by_master' && (
          <View style={styles.waitingBanner}>
            <Ionicons name="hourglass-outline" size={20} color={colors.warning} />
            <Text style={styles.waitingText}>Ожидает проверки супервайзером</Text>
          </View>
        )}
        {status === 'approved' && (
          <View style={styles.waitingBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.waitingText, { color: colors.success }]}>Этап принят</Text>
          </View>
        )}
      </View>

      <AppDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGradientEnd,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deadline: {
    ...typography.small,
    color: colors.textLight,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  projectTitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.xl,
  },
  rejectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    ...typography.bodyBold,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  rejectionReason: {
    ...typography.body,
    color: colors.text,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.md,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  // Photo report styles
  photoSection: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: spacing.lg,
  },
  photoHeader: {
    marginBottom: spacing.md,
  },
  photoTitle: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoItem: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 11,
  },
  photoAdd: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 45, 62, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 45, 62, 0.03)',
  },
  photoAddText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chatButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(248, 245, 242, 0.95)',
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  waitingText: {
    ...typography.bodyBold,
    color: colors.warning,
  },
  errorText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.huge,
  },
});
