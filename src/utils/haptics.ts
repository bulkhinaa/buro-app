import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Success haptic — object created, project submitted, stage approved, etc.
 */
export function hapticSuccess() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Error/warning haptic — validation failed, toast error shown.
 */
export function hapticError() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Light selection haptic — tab switch, toggle.
 */
export function hapticLight() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
