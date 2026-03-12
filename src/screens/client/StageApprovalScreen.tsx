import React, { useState, useEffect } from 'react';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import {
  ScreenWrapper,
  Card,
  Button,
  TextArea,
  Checkbox,
  Chip,
  AppDialog,
  SystemButton,
} from '../../components';
import type { DialogButton } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTaskStore } from '../../store/taskStore';
import { useProjectStore } from '../../store/projectStore';
import { updateStageStatus } from '../../services/projectService';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import type { LocalPhoto } from '../../store/taskStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

// Stable reference to avoid infinite re-renders in Zustand selector (BUG-16)
const EMPTY_PHOTOS: LocalPhoto[] = [];

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

export function StageApprovalScreen({ navigation, route }: Props) {
  const {
    stageId,
    stageTitle = 'Штукатурка стен',
    stageIndex = 5,
    projectId,
    projectTitle = 'Ремонт квартиры на Ленина 15',
  } = route.params || {};

  const { user } = useAuthStore();
  const { loadStages } = useProjectStore();
  const photoReports = useTaskStore((s) => s.photoReports[stageId] ?? EMPTY_PHOTOS);
  const showToast = useToastStore((s) => s.show);

  const [showRejection, setShowRejection] = useState(false);
  const [rejectionText, setRejectionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const isDev = user?.id.startsWith('dev-');
      if (!isDev && stageId) {
        await updateStageStatus(stageId, 'approved');
      }
      if (projectId) loadStages(projectId);

      setDialogTitle('Этап принят');
      setDialogMessage(
        'Мастер и супервайзер получат уведомление. Переходим к следующему этапу.',
      );
      setDialogButtons([
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
      setDialogVisible(true);
      hapticSuccess();
    } catch {
      showToast('Не удалось принять этап', 'error');
      hapticError();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!showRejection) {
      setShowRejection(true);
      return;
    }
    if (rejectionText.trim().length === 0) {
      showToast('Опишите замечания', 'error');
      hapticError();
      return;
    }

    setLoading(true);
    try {
      const isDev = user?.id.startsWith('dev-');
      if (!isDev && stageId) {
        await updateStageStatus(stageId, 'rejected');
      }
      if (projectId) loadStages(projectId);

      setDialogTitle('Замечания отправлены');
      setDialogMessage(
        'Мастер получит ваши замечания и доработает этот этап.',
      );
      setDialogButtons([
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
      setDialogVisible(true);
    } catch {
      showToast('Не удалось отправить замечания', 'error');
      hapticError();
    } finally {
      setLoading(false);
    }
  };

  // Photos from taskStore (master uploads) or empty
  const photos = photoReports.map((p) => p.uri);

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <Text style={styles.title}>Приёмка этапа</Text>

      {/* Stage info */}
      <View style={styles.stageInfo}>
        <Chip label={`Этап ${stageIndex}`} />
        <Text style={styles.stageTitle}>{stageTitle}</Text>
        <Text style={styles.projectTitle}>{projectTitle}</Text>
      </View>

      {/* Photos */}
      <Text style={styles.sectionTitle}>Фотоотчёт</Text>
      {photos.length > 0 ? (
        <View style={styles.photoGrid}>
          {photos.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.photo} />
          ))}
        </View>
      ) : (
        <Card style={styles.commentCard}>
          <Text style={styles.commentText}>
            Мастер ещё не загрузил фотоотчёт
          </Text>
        </Card>
      )}

      {/* Master comment — show first photo comment if available */}
      {photoReports.length > 0 && photoReports.some((p) => (p as any).comment) && (
        <Card style={styles.commentCard}>
          <Text style={styles.commentLabel}>Комментарий мастера:</Text>
          <Text style={styles.commentText}>
            {photoReports.find((p) => (p as any).comment)?.uri ? 'Фото загружены' : ''}
          </Text>
        </Card>
      )}

      {/* Rejection text area */}
      {showRejection && (
        <View style={styles.rejectionSection}>
          <TextArea
            placeholder="Опишите, что не устраивает"
            value={rejectionText}
            onChangeText={setRejectionText}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!showRejection ? (
          <>
            <Button
              title="Принять этап ✓"
              onPress={handleApprove}
              fullWidth
              loading={loading}
            />
            <Button
              title="Есть замечания"
              onPress={handleReject}
              variant="outline"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </>
        ) : (
          <Button
            title="Отправить замечания"
            onPress={handleReject}
            fullWidth
            loading={loading}
          />
        )}
      </View>

      <AppDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.heading,
    marginBottom: spacing.xxl,
  },
  stageInfo: {
    marginBottom: spacing.xxl,
  },
  stageTitle: {
    ...typography.h3,
    color: colors.heading,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  projectTitle: {
    ...typography.body,
    color: colors.textLight,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
    resizeMode: 'cover',
  },
  commentCard: {
    marginBottom: spacing.xxl,
  },
  commentLabel: {
    ...typography.smallBold,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  commentText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  checklist: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  rejectionSection: {
    marginBottom: spacing.lg,
  },
  actions: {
    marginBottom: spacing.huge,
  },
});
