import React, { useState } from 'react';
import { hapticSuccess } from '../../utils/haptics';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

// Mock data
const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=400',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a85?w=400',
];

const CHECKLIST = [
  'Поверхность ровная (допуск ≤2мм)',
  'Углы 90°',
  'Без трещин и пустот',
];

export function StageApprovalScreen({ navigation, route }: Props) {
  const {
    stageTitle = 'Штукатурка стен',
    stageIndex = 5,
    projectTitle = 'Ремонт квартиры на Ленина 15',
  } = route.params || {};

  const [showRejection, setShowRejection] = useState(false);
  const [rejectionText, setRejectionText] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const handleApprove = () => {
    setDialogTitle('Этап принят');
    setDialogMessage(
      'Мастер и супервайзер получат уведомление. Переходим к следующему этапу.',
    );
    setDialogButtons([
      {
        text: 'OK',
        onPress: () => {
          setDialogVisible(false);
          navigation.goBack();
        },
      },
    ]);
    setDialogVisible(true);
    hapticSuccess();
  };

  const handleReject = () => {
    if (!showRejection) {
      setShowRejection(true);
      return;
    }
    if (rejectionText.trim().length === 0) return;

    setDialogTitle('Замечания отправлены');
    setDialogMessage(
      'Мастер получит ваши замечания и доработает этот этап.',
    );
    setDialogButtons([
      {
        text: 'OK',
        onPress: () => {
          setDialogVisible(false);
          navigation.goBack();
        },
      },
    ]);
    setDialogVisible(true);
  };

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
      <View style={styles.photoGrid}>
        {MOCK_PHOTOS.map((url, i) => (
          <Image key={i} source={{ uri: url }} style={styles.photo} />
        ))}
      </View>

      {/* Master comment */}
      <Card style={styles.commentCard}>
        <Text style={styles.commentLabel}>Комментарий мастера:</Text>
        <Text style={styles.commentText}>
          Стены выровнены по маякам, допуск до 2мм. Использован Knauf Rotband.
        </Text>
      </Card>

      {/* Supervisor checklist */}
      <Text style={styles.sectionTitle}>Проверено супервайзером</Text>
      <View style={styles.checklist}>
        {CHECKLIST.map((item, i) => (
          <Checkbox
            key={i}
            checked={true}
            disabled={true}
            label={item}
            onPress={() => {}}
          />
        ))}
      </View>

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
            disabled={rejectionText.trim().length === 0}
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
