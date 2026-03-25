import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? colors.bgElevated : colors.white,
              shadowColor: isDark ? 'rgba(0,0,0,0.6)' : '#000',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          ) : null}

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
                    onClose();
                    // Delay btn.onPress so the Modal has time to unmount before
                    // any navigation call runs (fixes BUG-39/41/42/46/47).
                    setTimeout(() => btn.onPress(), 50);
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel && {
                      backgroundColor: colors.bgCard,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                    isDestructive && { backgroundColor: colors.dangerLight },
                    !isCancel && !isDestructive && { backgroundColor: colors.primary },
                    pressed && styles.buttonPressed,
                    index < buttons.length - 1 && styles.buttonSpacing,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && { color: colors.textLight },
                      isDestructive && { color: colors.danger },
                      !isCancel && !isDestructive && { color: colors.white },
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
    borderRadius: radius.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
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
  buttonPressed: {
    opacity: 0.8,
  },
  buttonSpacing: {},
  buttonText: {
    ...typography.bodyBold,
  },
});
