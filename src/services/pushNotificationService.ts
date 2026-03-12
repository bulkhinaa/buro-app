/**
 * Push Notification Service
 *
 * Handles registration, token management, and local/push notifications
 * using Expo Notifications. Works on iOS, Android, and web (limited).
 *
 * "Live broadcast" — persistent notification showing:
 * - Current active stage name
 * - Days remaining until deadline
 * - Assigned worker name
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// ─── Configuration ──────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowInForeground: true,
  }),
});

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface LiveBroadcastData {
  projectTitle: string;
  currentStage: string;
  daysRemaining: number;
  workerName: string;
  progress: number; // 0-1
}

// ─── Token Registration ─────────────────────────────────────────────────────────

/**
 * Register for push notifications and return the Expo push token.
 * On web, returns null (web push requires additional setup).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Web doesn't support Expo push tokens
  if (Platform.OS === 'web') return null;

  // Must be a physical device
  if (!Device.isDevice) {
    console.warn('[Push] Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ??
                       Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Уведомления',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7B2D3E',
      });

      // Persistent channel for live broadcast
      await Notifications.setNotificationChannelAsync('live-broadcast', {
        name: 'Эфир ремонта',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    return tokenData.data;
  } catch (err) {
    console.warn('[Push] Failed to get token:', err);
    return null;
  }
}

/**
 * Save push token to Supabase for server-side notifications.
 */
export async function savePushToken(
  userId: string,
  token: string,
): Promise<void> {
  if (userId.startsWith('dev-')) return; // Skip for dev users

  try {
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' },
    );
  } catch (err) {
    console.warn('[Push] Failed to save token:', err);
  }
}

// ─── Local Notifications ────────────────────────────────────────────────────────

/**
 * Show a local notification immediately.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
    },
    trigger: null, // Immediate
  });
}

/**
 * Schedule a local notification for the future.
 */
export async function scheduleNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  data?: Record<string, any>,
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });
  return id;
}

// ─── Live Broadcast (Persistent Notification) ───────────────────────────────────

const LIVE_BROADCAST_ID = 'live-broadcast';

/**
 * Show/update the persistent "live broadcast" notification.
 * Shows: current stage, days remaining, worker name, progress.
 *
 * On Android: uses low-importance channel (no sound, stays in notification shade)
 * On iOS: regular notification (iOS doesn't support persistent notifications)
 */
export async function showLiveBroadcast(data: LiveBroadcastData): Promise<void> {
  if (Platform.OS === 'web') return;

  const { projectTitle, currentStage, daysRemaining, workerName, progress } = data;

  // Build progress bar text
  const progressPct = Math.round(progress * 100);
  const barFilled = Math.round(progress * 10);
  const barEmpty = 10 - barFilled;
  const progressBar = '▓'.repeat(barFilled) + '░'.repeat(barEmpty);

  const daysText = daysRemaining > 0
    ? `${daysRemaining} дн. до сдачи`
    : daysRemaining === 0
      ? 'Сдача сегодня!'
      : `Просрочено на ${Math.abs(daysRemaining)} дн.`;

  // Cancel previous live broadcast
  await Notifications.cancelScheduledNotificationAsync(LIVE_BROADCAST_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: LIVE_BROADCAST_ID,
    content: {
      title: `🔨 ${currentStage}`,
      body: `${workerName} · ${daysText}\n${progressBar} ${progressPct}%`,
      subtitle: projectTitle,
      data: { type: 'live_broadcast' },
      sound: undefined, // No sound for persistent notification
      sticky: Platform.OS === 'android', // Android: persistent
      ...(Platform.OS === 'android' ? {
        channelId: 'live-broadcast',
        priority: Notifications.AndroidNotificationPriority.LOW,
      } : {}),
    },
    trigger: null,
  });
}

/**
 * Dismiss the live broadcast notification.
 */
export async function dismissLiveBroadcast(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(LIVE_BROADCAST_ID).catch(() => {});
  await Notifications.dismissNotificationAsync(LIVE_BROADCAST_ID).catch(() => {});
}

// ─── Notification Listeners ─────────────────────────────────────────────────────

/**
 * Add a listener for when a notification is received while app is foregrounded.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when user taps a notification.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// ─── Badge ──────────────────────────────────────────────────────────────────────

/**
 * Set the app badge count (iOS only).
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear the app badge.
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
