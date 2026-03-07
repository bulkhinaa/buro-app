import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

export interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: DialogButton[];
  onClose: () => void;
}

export function AppDialog({
  visible,
  title,
  message,
  buttons,
  onClose,
}: AppDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <ScrollView
            style={styles.buttonsScroll}
            contentContainerStyle={styles.buttonsContainer}
            showsVerticalScrollIndicator={false}
          >
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    btn.onPress();
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !isCancel && !isDestructive && styles.buttonDefault,
                    pressed && styles.buttonPressed,
                    index < buttons.length - 1 && styles.buttonSpacing,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                      !isCancel && !isDestructive && styles.buttonTextDefault,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    ...typography.h3,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonsScroll: {
    maxHeight: 280,
  },
  buttonsContainer: {
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonDefault: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDestructive: {
    backgroundColor: colors.dangerLight,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonSpacing: {},
  buttonText: {
    ...typography.bodyBold,
  },
  buttonTextDefault: {
    color: colors.white,
  },
  buttonTextCancel: {
    color: colors.textLight,
  },
  buttonTextDestructive: {
    color: colors.danger,
  },
});
