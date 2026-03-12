import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  StatusBadge,
  Button,
  AppDialog,
  MasterSelectModal,
} from '../../components';
import type { DialogButton, MasterCandidate } from '../../components';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { Stage, PhotoReport } from '../../types';
import {
  fetchProjectStages,
  fetchStagePhotos,
  supervisorApproveStage,
  supervisorRejectStage,
} from '../../services/projectService';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile, generateFilePath } from '../../services/storageService';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { useToastStore } from '../../store/toastStore';

const MAX_SUPERVISOR_PHOTOS = 10;

// ─── Web outline reset ────────────────────────────────────────────────────────

const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STAGE: Stage = {
  id: 'stg-5',
  project_id: 'sp-1',
  title: 'Штукатурка стен',
  description: 'Выравнивание стен, штукатурка по маякам. Все стены должны быть отштукатурены под правило 2 метра с допуском не более 2 мм.',
  order_index: 5,
  status: 'done_by_master',
  deadline: '2025-02-20',
  started_at: '2025-02-10',
  completed_at: '2025-02-18',
};

const MOCK_CHECKLIST = [
  'Грунтовка стен перед нанесением штукатурки',
  'Установка маяков по уровню',
  'Нанесение штукатурки по маякам',
  'Проверка плоскости правилом (2 метра)',
  'Вертикальность углов проверена',
  'Заглаживание поверхности',
];

const MOCK_PHOTOS: PhotoReport[] = [
  {
    id: 'ph-1',
    stage_id: 'stg-5',
    uploaded_by: 'master-1',
    url: 'https://images.unsplash.com/photo-1581093806997-124204d9fa9d?w=600',
    comment: 'Грунтовка нанесена',
    created_at: '2025-02-11T10:00:00Z',
  },
  {
    id: 'ph-2',
    stage_id: 'stg-5',
    uploaded_by: 'master-1',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
    comment: 'Маяки установлены',
    created_at: '2025-02-12T14:00:00Z',
  },
  {
    id: 'ph-3',
    stage_id: 'stg-5',
    uploaded_by: 'master-1',
    url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600',
    comment: 'Штукатурка нанесена, финальный слой',
    created_at: '2025-02-18T16:00:00Z',
  },
];

// ─── Mock masters for dev mode ────────────────────────────────────────────────

const MOCK_MASTERS: MasterCandidate[] = [
  { id: 'm-1', name: 'Иван Кузнецов', specialization: 'Штукатур', rating: 4.8, reviewCount: 34, activeTasksCount: 1 },
  { id: 'm-2', name: 'Сергей Попов', specialization: 'Универсал', rating: 4.5, reviewCount: 22, activeTasksCount: 2 },
  { id: 'm-3', name: 'Дмитрий Лебедев', specialization: 'Электрик', rating: 4.9, reviewCount: 56, activeTasksCount: 0 },
  { id: 'm-4', name: 'Андрей Морозов', specialization: 'Плиточник', rating: 4.7, reviewCount: 18, activeTasksCount: 1 },
  { id: 'm-5', name: 'Павел Новиков', specialization: 'Сантехник', rating: 4.6, reviewCount: 41, activeTasksCount: 0 },
  { id: 'm-6', name: 'Виктор Соловьёв', specialization: 'Маляр', rating: 4.3, reviewCount: 12, activeTasksCount: 3 },
];

// ─── Checklist item state ─────────────────────────────────────────────────────

type CheckState = 'unchecked' | 'done' | 'na';

interface ChecklistEntry {
  text: string;
  state: CheckState;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupervisorStageDetailScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const isDev = user?.id?.startsWith('dev-');
  const showToast = useToastStore((s) => s.show);

  const stageId: string = route?.params?.stageId ?? 'stg-5';
  const projectId: string = route?.params?.projectId ?? 'sp-1';
  const stageTitle: string = route?.params?.stageTitle ?? 'Этап';

  const [stage, setStage] = useState<Stage | null>(isDev ? MOCK_STAGE : null);
  const [photos, setPhotos] = useState<PhotoReport[]>(isDev ? MOCK_PHOTOS : []);
  const [checklist, setChecklist] = useState<ChecklistEntry[]>(
    isDev ? MOCK_CHECKLIST.map((t) => ({ text: t, state: 'unchecked' as CheckState })) : [],
  );
  const [loading, setLoading] = useState(!isDev);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  // Master select modal
  const [masterModalVisible, setMasterModalVisible] = useState(false);
  const [assignedMaster, setAssignedMaster] = useState<MasterCandidate | null>(null);

  // Supervisor photo upload
  const [supervisorPhotos, setSupervisorPhotos] = useState<{ uri: string; uploading?: boolean }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePickPhoto = useCallback(async () => {
    if (supervisorPhotos.length >= MAX_SUPERVISOR_PHOTOS) {
      showToast(`Максимум ${MAX_SUPERVISOR_PHOTOS} фото`, 'warning');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_SUPERVISOR_PHOTOS - supervisorPhotos.length,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const newPhotos = result.assets.map((a) => ({ uri: a.uri }));
      setSupervisorPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_SUPERVISOR_PHOTOS));

      // Upload to Supabase in background (non-dev only)
      if (!isDev) {
        setUploadingPhoto(true);
        for (const asset of result.assets) {
          const path = generateFilePath(`stages/${stageId}/supervisor`);
          await uploadFile('photo-reports', path, asset.uri);
        }
        setUploadingPhoto(false);
        showToast('Фото загружены', 'success');
      } else {
        showToast(`${newPhotos.length} фото добавлено`, 'success');
      }
    } catch {
      showToast('Не удалось выбрать фото', 'error');
    }
  }, [supervisorPhotos.length, isDev, stageId, showToast]);

  const handleTakePhoto = useCallback(async () => {
    if (supervisorPhotos.length >= MAX_SUPERVISOR_PHOTOS) {
      showToast(`Максимум ${MAX_SUPERVISOR_PHOTOS} фото`, 'warning');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Нет доступа к камере', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const newPhoto = { uri: result.assets[0].uri };
      setSupervisorPhotos((prev) => [...prev, newPhoto].slice(0, MAX_SUPERVISOR_PHOTOS));

      if (!isDev) {
        setUploadingPhoto(true);
        const path = generateFilePath(`stages/${stageId}/supervisor`);
        await uploadFile('photo-reports', path, result.assets[0].uri);
        setUploadingPhoto(false);
        showToast('Фото загружено', 'success');
      } else {
        showToast('Фото добавлено', 'success');
      }
    } catch {
      showToast('Не удалось сделать фото', 'error');
    }
  }, [supervisorPhotos.length, isDev, stageId, showToast]);

  const handleRemoveSupervisorPhoto = useCallback((idx: number) => {
    setSupervisorPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const showDialog = (title: string, message: string, buttons: DialogButton[]) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogVisible(true);
  };

  const handleAssignMaster = (master: MasterCandidate) => {
    setAssignedMaster(master);
    setMasterModalVisible(false);
    // Transition stage from pending to in_progress
    setStage((prev) => prev ? { ...prev, status: 'in_progress', started_at: new Date().toISOString() } : prev);
    hapticSuccess();
    showToast(`${master.name} назначен на этап`, 'success');
    // TODO: In production, call assignMasterToStage(stageId, master.id) via Supabase
  };

  // ─── Load data ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (isDev) return;
    setLoading(true);
    try {
      const [allStages, stagePhotos] = await Promise.all([
        fetchProjectStages(projectId),
        fetchStagePhotos(stageId),
      ]);
      const found = allStages.find((s) => s.id === stageId);
      if (found) {
        setStage(found);
        // Load checklist from template data
        // In production, checklist would come from stage_templates or stage record
        setChecklist(MOCK_CHECKLIST.map((t) => ({ text: t, state: 'unchecked' as CheckState })));
      }
      setPhotos(stagePhotos);
    } catch {
      // silently fall back
    } finally {
      setLoading(false);
    }
  }, [stageId, projectId, isDev]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Checklist logic ──────────────────────────────────────────────────────

  const allChecked = checklist.length > 0 && checklist.every((c) => c.state !== 'unchecked');
  const doneCount = checklist.filter((c) => c.state !== 'unchecked').length;

  const cycleCheckState = (idx: number) => {
    if (stage?.status !== 'done_by_master') return; // read-only after decision
    setChecklist((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next: CheckState =
          item.state === 'unchecked' ? 'done'
          : item.state === 'done' ? 'na'
          : 'unchecked';
        return { ...item, state: next };
      }),
    );
  };

  // ─── Approve ──────────────────────────────────────────────────────────────

  const handleApprove = () => {
    if (!allChecked) {
      showToast('Отметьте все пункты чек-листа перед принятием', 'warning');
      return;
    }
    showDialog(
      'Принять этап?',
      'Вы подтверждаете, что работы выполнены в соответствии с требованиями. Клиент получит уведомление.',
      [
        {
          text: 'Принять ✓',
          onPress: async () => {
            setSaving(true);
            try {
              if (!isDev) await supervisorApproveStage(stageId);
              setStage((prev) => prev ? { ...prev, status: 'approved', approved_at: new Date().toISOString() } : prev);
              hapticSuccess();
              showToast('Этап принят. Клиент уведомлён.', 'success');
              // navigation.goBack() is called after AppDialog closes (setTimeout in AppDialog)
              navigation.goBack();
            } catch (e) {
              showToast('Ошибка при принятии этапа', 'error');
            } finally {
              setSaving(false);
            }
          },
        },
        { text: 'Отмена', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  // ─── Reject ───────────────────────────────────────────────────────────────

  const handleRejectSubmit = async () => {
    if (!rejectComment.trim()) {
      showToast('Укажите причину отклонения', 'warning');
      return;
    }
    showDialog(
      'Отклонить этап?',
      `Мастер получит задание на доработку:\n«${rejectComment.trim()}»`,
      [
        {
          text: 'Отклонить ✗',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              if (!isDev) await supervisorRejectStage(stageId, rejectComment.trim());
              setStage((prev) => prev ? { ...prev, status: 'rejected' } : prev);
              hapticError();
              showToast('Этап отклонён. Мастер уведомлён.', 'info');
              navigation.goBack();
            } catch {
              showToast('Ошибка при отклонении этапа', 'error');
            } finally {
              setSaving(false);
            }
          },
        },
        { text: 'Отмена', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!stage) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Этап не найден</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const isReviewable = stage.status === 'done_by_master';
  const isDecided = stage.status === 'approved' || stage.status === 'rejected';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <StatusBadge status={stage.status} />
            <Text style={styles.orderIndex}>Этап {stage.order_index}</Text>
          </View>
          <Text style={styles.title}>{stage.title}</Text>
          {stage.description && (
            <Text style={styles.description}>{stage.description}</Text>
          )}
        </View>

        {/* Timeline */}
        {(stage.started_at || stage.completed_at || stage.deadline) && (
          <Card>
            <Text style={styles.sectionLabel}>Сроки</Text>
            {stage.deadline && (
              <View style={styles.timeRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.textLight} />
                <Text style={styles.timeLabel}>Срок:</Text>
                <Text style={styles.timeValue}>
                  {new Date(stage.deadline).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}
            {stage.started_at && (
              <View style={styles.timeRow}>
                <Ionicons name="play-circle-outline" size={15} color={colors.primary} />
                <Text style={styles.timeLabel}>Начат:</Text>
                <Text style={styles.timeValue}>{formatDateTime(stage.started_at)}</Text>
              </View>
            )}
            {stage.completed_at && (
              <View style={styles.timeRow}>
                <Ionicons name="flag-outline" size={15} color={colors.accent} />
                <Text style={styles.timeLabel}>Сдан мастером:</Text>
                <Text style={styles.timeValue}>{formatDateTime(stage.completed_at)}</Text>
              </View>
            )}
            {stage.approved_at && (
              <View style={styles.timeRow}>
                <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
                <Text style={styles.timeLabel}>Принят:</Text>
                <Text style={styles.timeValue}>{formatDateTime(stage.approved_at)}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Assigned master or assign button */}
        {assignedMaster ? (
          <Card>
            <Text style={styles.sectionLabel}>Мастер</Text>
            <View style={styles.assignedRow}>
              <View style={styles.assignedAvatar}>
                <Ionicons name="person" size={18} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assignedName}>{assignedMaster.name}</Text>
                <Text style={styles.assignedSpec}>{assignedMaster.specialization}</Text>
              </View>
              <View style={styles.assignedRating}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.assignedRatingText}>{assignedMaster.rating.toFixed(1)}</Text>
              </View>
            </View>
          </Card>
        ) : stage.status === 'pending' ? (
          <Button
            title="Назначить мастера"
            onPress={() => setMasterModalVisible(true)}
            variant="outline"
            fullWidth
            icon={<Ionicons name="person-add-outline" size={18} color={colors.primary} />}
          />
        ) : null}

        {/* Photo gallery */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Фотоотчёт мастера</Text>
            <Text style={styles.sectionCount}>{photos.length} фото</Text>
          </View>

          {photos.length === 0 ? (
            <Card style={styles.emptyPhotos}>
              <Ionicons name="camera-outline" size={32} color={colors.textLight} />
              <Text style={styles.emptyPhotosText}>Мастер ещё не загрузил фото</Text>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {photos.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setSelectedPhoto(photo.url)}
                  style={styles.photoWrap}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  {photo.comment && (
                    <View style={styles.photoCaption}>
                      <Text style={styles.photoCaptionText} numberOfLines={1}>
                        {photo.comment}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.photoDate}>
                    {new Date(photo.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Full-screen photo viewer */}
        {selectedPhoto && (
          <Pressable
            style={styles.photoOverlay}
            onPress={() => setSelectedPhoto(null)}
          >
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.photoFull}
              resizeMode="contain"
            />
            <View style={styles.photoCloseBtn}>
              <Ionicons name="close-circle" size={32} color={colors.white} />
            </View>
          </Pressable>
        )}

        {/* Supervisor photo upload */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Фото супервайзера</Text>
            <Text style={styles.sectionCount}>
              {supervisorPhotos.length}/{MAX_SUPERVISOR_PHOTOS}
            </Text>
          </View>

          {/* Photo grid */}
          {supervisorPhotos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {supervisorPhotos.map((photo, idx) => (
                <View key={`sv-photo-${idx}`} style={styles.svPhotoWrap}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.svPhoto}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.svPhotoRemove}
                    onPress={() => handleRemoveSupervisorPhoto(idx)}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Upload buttons */}
          <View style={styles.uploadRow}>
            <Pressable
              style={styles.uploadBtn}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
            >
              <Ionicons name="images-outline" size={20} color={colors.primary} />
              <Text style={styles.uploadBtnText}>Галерея</Text>
            </Pressable>
            {Platform.OS !== 'web' && (
              <Pressable
                style={styles.uploadBtn}
                onPress={handleTakePhoto}
                disabled={uploadingPhoto}
              >
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.uploadBtnText}>Камера</Text>
              </Pressable>
            )}
            {uploadingPhoto && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Чек-лист</Text>
            <Text style={[
              styles.sectionCount,
              allChecked && { color: colors.success },
            ]}>
              {doneCount}/{checklist.length}
            </Text>
          </View>

          {!isReviewable && !isDecided && (
            <View style={styles.checklistNote}>
              <Ionicons name="information-circle-outline" size={15} color={colors.textLight} />
              <Text style={styles.checklistNoteText}>
                Чек-лист доступен для заполнения, когда мастер сдаёт этап
              </Text>
            </View>
          )}

          <Card style={styles.checklistCard}>
            {checklist.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => cycleCheckState(idx)}
                style={[
                  styles.checkRow,
                  idx < checklist.length - 1 && styles.checkRowBorder,
                ]}
              >
                {/* Checkbox */}
                <View style={[
                  styles.checkbox,
                  item.state === 'done' && styles.checkboxDone,
                  item.state === 'na' && styles.checkboxNa,
                ]}>
                  {item.state === 'done' && (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  )}
                  {item.state === 'na' && (
                    <Text style={styles.naText}>Н/П</Text>
                  )}
                </View>

                {/* Text */}
                <Text style={[
                  styles.checkText,
                  item.state === 'done' && styles.checkTextDone,
                  item.state === 'na' && styles.checkTextNa,
                ]}>
                  {item.text}
                </Text>

                {/* Tap hint */}
                {isReviewable && (
                  <Text style={styles.checkHint}>
                    {item.state === 'unchecked' ? '→ ✓' : item.state === 'done' ? '→ Н/П' : '→ ☐'}
                  </Text>
                )}
              </Pressable>
            ))}
          </Card>

          {isReviewable && !allChecked && (
            <View style={styles.checklistWarning}>
              <Ionicons name="warning-outline" size={15} color={colors.warning} />
              <Text style={styles.checklistWarningText}>
                Отметьте все пункты перед принятием (✓ выполнено или Н/П — не применимо)
              </Text>
            </View>
          )}
        </View>

        {/* Approve / Reject actions (only when status = done_by_master) */}
        {isReviewable && (
          <View style={styles.actionsSection}>
            <Text style={styles.actionsSectionTitle}>Решение по этапу</Text>

            {/* Approve */}
            <Button
              title={allChecked ? 'Принять этап ✓' : 'Принять (заполните чек-лист)'}
              onPress={handleApprove}
              loading={saving}
              style={[
                styles.approveBtn,
                !allChecked && { opacity: 0.5 },
              ]}
            />

            {/* Reject toggle */}
            {!showRejectInput ? (
              <Button
                title="Отклонить и запросить переделку"
                onPress={() => setShowRejectInput(true)}
                variant="outline"
                style={styles.rejectBtn}
              />
            ) : (
              <View style={styles.rejectInputBlock}>
                <Text style={styles.rejectLabel}>Что нужно переделать:</Text>
                <TextInput
                  style={[styles.rejectInput, webInputReset]}
                  placeholder="Опишите дефекты или требования к переделке..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={4}
                  value={rejectComment}
                  onChangeText={setRejectComment}
                  textAlignVertical="top"
                />
                <View style={styles.rejectActions}>
                  <Button
                    title="Отклонить ✗"
                    onPress={handleRejectSubmit}
                    variant="outline"
                    loading={saving}
                    style={[styles.rejectSubmitBtn, { borderColor: colors.danger }]}
                  />
                  <Pressable
                    onPress={() => { setShowRejectInput(false); setRejectComment(''); }}
                    style={styles.cancelRejectBtn}
                  >
                    <Text style={styles.cancelRejectText}>Отмена</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Already decided state */}
        {stage.status === 'approved' && (
          <Card style={styles.decidedCard}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            <Text style={styles.decidedTitle}>Этап принят</Text>
            {stage.approved_at && (
              <Text style={styles.decidedDate}>{formatDateTime(stage.approved_at)}</Text>
            )}
          </Card>
        )}

        {stage.status === 'rejected' && (
          <Card style={[styles.decidedCard, styles.decidedCardRejected]}>
            <Ionicons name="close-circle" size={28} color={colors.danger} />
            <Text style={[styles.decidedTitle, { color: colors.danger }]}>Этап отклонён</Text>
            <Text style={styles.decidedDate}>Мастер получил задание на доработку</Text>
          </Card>
        )}
      </ScrollView>

      <AppDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />

      <MasterSelectModal
        visible={masterModalVisible}
        onClose={() => setMasterModalVisible(false)}
        onSelect={handleAssignMaster}
        masters={isDev ? MOCK_MASTERS : []}
        stageTitle={stage.title}
      />
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },

  // Header
  header: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIndex: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    color: colors.heading,
  },
  description: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },

  // Timeline
  sectionLabel: {
    ...typography.caption,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timeLabel: {
    ...typography.small,
    color: colors.textLight,
    width: 110,
  },
  timeValue: {
    ...typography.smallBold,
    color: colors.heading,
    flex: 1,
  },

  // Sections
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
  },
  sectionCount: {
    ...typography.smallBold,
    color: colors.textLight,
  },

  // Photos
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyPhotosText: {
    ...typography.small,
    color: colors.textLight,
  },
  photoRow: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  photoWrap: {
    width: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: 180,
    height: 135,
  },
  photoCaption: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  photoCaptionText: {
    ...typography.caption,
    color: colors.white,
  },
  photoDate: {
    ...typography.caption,
    color: colors.textLight,
    padding: spacing.sm,
  },

  // Full-screen photo
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  photoFull: {
    width: '100%',
    height: '80%',
  },
  photoCloseBtn: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
  },

  // Checklist
  checklistNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(142,142,147,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checklistNoteText: {
    ...typography.small,
    color: colors.textLight,
    flex: 1,
  },
  checklistCard: {
    padding: 0,
    overflow: 'hidden',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  checkRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxNa: {
    backgroundColor: colors.textLight,
    borderColor: colors.textLight,
  },
  naText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  checkText: {
    ...typography.body,
    color: colors.heading,
    flex: 1,
  },
  checkTextDone: {
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  checkTextNa: {
    color: colors.textLight,
    fontStyle: 'italic',
  },
  checkHint: {
    ...typography.caption,
    color: colors.border,
    fontWeight: '600',
  },
  checklistWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checklistWarningText: {
    ...typography.small,
    color: colors.warning,
    flex: 1,
  },

  // Actions
  actionsSection: {
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionsSectionTitle: {
    ...typography.h3,
    color: colors.heading,
  },
  approveBtn: {
    // uses default Button style
  },
  rejectBtn: {
    borderColor: colors.danger,
  },
  rejectInputBlock: {
    gap: spacing.sm,
  },
  rejectLabel: {
    ...typography.smallBold,
    color: colors.heading,
  },
  rejectInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...typography.body,
    color: colors.heading,
    minHeight: 100,
    borderWidth: 0,
  },
  rejectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rejectSubmitBtn: {
    flex: 1,
  },
  cancelRejectBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelRejectText: {
    ...typography.body,
    color: colors.textLight,
  },

  // Decided state cards
  decidedCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: 'rgba(52,199,89,0.06)',
  },
  decidedCardRejected: {
    backgroundColor: 'rgba(255,59,48,0.06)',
  },
  decidedTitle: {
    ...typography.bodyBold,
    color: colors.success,
  },
  decidedDate: {
    ...typography.small,
    color: colors.textLight,
  },

  // Assigned master
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assignedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedName: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  assignedSpec: {
    ...typography.small,
    color: colors.textLight,
  },
  assignedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  assignedRatingText: {
    ...typography.smallBold,
    color: colors.heading,
  },

  // Supervisor photo upload
  svPhotoWrap: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  svPhoto: {
    width: 120,
    height: 120,
  },
  svPhotoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  uploadBtnText: {
    ...typography.smallBold,
    color: colors.primary,
  },

  // Empty
  emptyText: {
    ...typography.bodyBold,
    color: colors.heading,
  },
});
