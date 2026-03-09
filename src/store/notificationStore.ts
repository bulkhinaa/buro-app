import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationType =
  | 'new_task'
  | 'task_approved'
  | 'task_rejected'
  | 'new_message'
  | 'stage_started'
  | 'stage_completed';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  project_id?: string;
  stage_id?: string;
  created_at: string;
}

const NOTIFICATIONS_KEY = 'notifications';

// Default mock notifications for dev users
const DEV_MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'dev-master',
    type: 'new_task',
    title: 'Новая задача',
    body: 'Вам назначена задача «Укладка плитки в ванной»',
    is_read: false,
    project_id: 'proj-2',
    stage_id: 'mt-2',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'dev-master',
    type: 'task_approved',
    title: 'Этап принят',
    body: 'Супервайзер принял этап «Демонтаж» — отличная работа!',
    is_read: false,
    project_id: 'proj-1',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    user_id: 'dev-master',
    type: 'new_message',
    title: 'Новое сообщение',
    body: 'Супервайзер Михаил написал вам в чате',
    is_read: true,
    project_id: 'proj-1',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    user_id: 'dev-master',
    type: 'task_rejected',
    title: 'Требуется доработка',
    body: 'Этап «Электрика (черновая)» отклонён — проверьте комментарий',
    is_read: true,
    project_id: 'proj-1',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface NotificationState {
  notifications: AppNotification[];
  isLoading: boolean;
  realtimeChannel: RealtimeChannel | null;

  // Computed
  unreadCount: () => number;

  // Actions
  loadNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  realtimeChannel: null,

  unreadCount: () => {
    return get().notifications.filter((n) => !n.is_read).length;
  },

  loadNotifications: async (userId: string) => {
    set({ isLoading: true });

    const isDevUser = userId.startsWith('dev-');

    if (isDevUser) {
      // Dev user — load from AsyncStorage or use defaults
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        if (stored) {
          set({ notifications: JSON.parse(stored), isLoading: false });
        } else {
          await AsyncStorage.setItem(
            NOTIFICATIONS_KEY,
            JSON.stringify(DEV_MOCK_NOTIFICATIONS),
          );
          set({ notifications: DEV_MOCK_NOTIFICATIONS, isLoading: false });
        }
      } catch {
        set({ notifications: DEV_MOCK_NOTIFICATIONS, isLoading: false });
      }
    } else {
      // Real user — fetch from Supabase
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          set({ notifications: data as AppNotification[], isLoading: false });
          // Cache locally for offline access
          await AsyncStorage.setItem(
            NOTIFICATIONS_KEY,
            JSON.stringify(data),
          ).catch(() => {});
        } else {
          set({ notifications: [], isLoading: false });
        }
      } catch {
        // Fallback to stored cache
        try {
          const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
          set({
            notifications: stored ? JSON.parse(stored) : [],
            isLoading: false,
          });
        } catch {
          set({ notifications: [], isLoading: false });
        }
      }
    }
  },

  markAsRead: async (notificationId: string) => {
    const { notifications } = get();
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, is_read: true } : n,
    );
    set({ notifications: updated });

    // Persist locally
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    // Try Supabase (non-blocking)
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch {
      // Dev fallback — already saved locally
    }
  },

  markAllAsRead: async (userId: string) => {
    const { notifications } = get();
    const updated = notifications.map((n) => ({ ...n, is_read: true }));
    set({ notifications: updated });

    // Persist locally
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    // Try Supabase (non-blocking)
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    } catch {
      // Dev fallback
    }
  },

  subscribeRealtime: (userId: string) => {
    // Skip for dev users
    if (userId.startsWith('dev-')) return;

    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          const { notifications } = get();
          // Prepend new notification (newest first)
          const updated = [newNotif, ...notifications];
          set({ notifications: updated });
          // Update cache
          AsyncStorage.setItem(
            NOTIFICATIONS_KEY,
            JSON.stringify(updated),
          ).catch(() => {});
        },
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },
}));
