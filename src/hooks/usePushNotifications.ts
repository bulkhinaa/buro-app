/**
 * Hook to initialize push notifications and handle notification taps.
 * Should be used once in the root App component.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  setBadgeCount,
} from '../services/pushNotificationService';
import { useNotificationStore } from '../store/notificationStore';

export function usePushNotifications(navigationRef: any) {
  const { user } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || initialized.current) return;
    if (Platform.OS === 'web') return; // Web push not supported yet

    initialized.current = true;

    // Register and save token
    (async () => {
      const token = await registerForPushNotifications();
      if (token && user.id) {
        await savePushToken(user.id, token);
      }
    })();

    // Listen for notifications received while app is open
    const receivedSub = addNotificationReceivedListener((notification) => {
      // Update badge count
      const unread = useNotificationStore.getState().unreadCount();
      setBadgeCount(unread + 1);
    });

    // Listen for notification taps
    const responseSub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;

      if (!navigationRef?.current) return;
      const nav = navigationRef.current;

      // Route based on notification data
      if (data?.type === 'live_broadcast') {
        // Tap on live broadcast → go to project detail
        if (data.projectId) {
          nav.navigate('ProjectDetail', { projectId: data.projectId });
        }
        return;
      }

      if (data?.type === 'new_message' && data.projectId) {
        nav.navigate('Chat', { projectId: data.projectId });
        return;
      }

      // Master offer: navigate to offer detail
      if (data?.type === 'master_offer' && data.stageId) {
        nav.navigate('MasterOfferDetail', {
          offerId: data.offerId,
          stageId: data.stageId,
          projectId: data.projectId,
        });
        return;
      }

      // Master accepted/declined: navigate to project detail
      if (data?.type === 'master_accepted' || data?.type === 'master_declined') {
        if (data.projectId) {
          nav.navigate('ProjectDetail', { projectId: data.projectId });
        }
        return;
      }

      // Schedule reminder: navigate to schedule
      if (data?.type === 'schedule_reminder') {
        nav.navigate('Schedule');
        return;
      }

      if (data?.projectId) {
        nav.navigate('ProjectDetail', { projectId: data.projectId });
        return;
      }

      // Default: go to notifications screen
      nav.navigate('NotificationsStack');
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user, navigationRef]);
}
