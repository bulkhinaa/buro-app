import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';
import { supabase } from '../lib/supabase';

const CHAT_KEY_PREFIX = 'chat_messages_';

// Default mock messages for dev users
const DEV_MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  stage_mt_1: [
    {
      id: 'msg-1',
      project_id: 'proj-1',
      sender_id: 'dev-supervisor',
      text: 'Добрый день! Я ваш супервайзер, Михаил. Сегодня провёл проверку — штукатурка стен идёт по графику.',
      created_at: '2025-02-05T10:00:00Z',
    },
    {
      id: 'msg-2',
      project_id: 'proj-1',
      sender_id: 'dev-master',
      text: 'Отлично, спасибо! Завтра заканчиваю штукатурку в коридоре, загружу фото.',
      created_at: '2025-02-05T14:00:00Z',
    },
  ],
};

// Sender info for display (dev-mode only)
export const DEV_SENDER_NAMES: Record<string, string> = {
  'dev-supervisor': 'Михаил (супервайзер)',
  'dev-client': 'Клиент',
};

interface ChatState {
  messages: Record<string, ChatMessage[]>; // channelId → messages
  isLoading: boolean;

  // Actions
  loadMessages: (channelId: string, projectId: string) => Promise<void>;
  sendMessage: (channelId: string, projectId: string, userId: string, text: string) => Promise<void>;
  getMessages: (channelId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isLoading: false,

  loadMessages: async (channelId: string, projectId: string) => {
    set({ isLoading: true });

    // Try to load from AsyncStorage first (works for both dev and offline)
    try {
      const stored = await AsyncStorage.getItem(CHAT_KEY_PREFIX + channelId);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        set((state) => ({
          messages: { ...state.messages, [channelId]: parsed },
          isLoading: false,
        }));
        return;
      }
    } catch {
      // Ignore
    }

    // Try Supabase for real users
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        set((state) => ({
          messages: { ...state.messages, [channelId]: data as ChatMessage[] },
          isLoading: false,
        }));
        await AsyncStorage.setItem(
          CHAT_KEY_PREFIX + channelId,
          JSON.stringify(data),
        );
        return;
      }
    } catch {
      // Supabase not available — use mock data
    }

    // Fallback to mock data for dev users
    // Normalize channelId: stage_mt-1 → stage_mt_1 for lookup
    const normalizedKey = channelId.replace(/-/g, '_');
    const mockMessages = DEV_MOCK_MESSAGES[normalizedKey] || [];
    if (mockMessages.length > 0) {
      await AsyncStorage.setItem(
        CHAT_KEY_PREFIX + channelId,
        JSON.stringify(mockMessages),
      ).catch(() => {});
    }

    set((state) => ({
      messages: { ...state.messages, [channelId]: mockMessages },
      isLoading: false,
    }));
  },

  sendMessage: async (channelId: string, projectId: string, userId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      project_id: projectId,
      sender_id: userId,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    // Add locally first (optimistic)
    const { messages } = get();
    const existing = messages[channelId] || [];
    const updated = [...existing, newMsg];

    set((state) => ({
      messages: { ...state.messages, [channelId]: updated },
    }));

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(
        CHAT_KEY_PREFIX + channelId,
        JSON.stringify(updated),
      );
    } catch {
      // Ignore
    }

    // Try to send to Supabase (non-blocking for dev)
    const isDev = userId.startsWith('dev-');
    if (!isDev) {
      try {
        await supabase.from('messages').insert({
          channel_id: channelId,
          project_id: projectId,
          sender_id: userId,
          text: text.trim(),
        });
      } catch {
        // Dev mode — already saved locally
      }
    }
  },

  getMessages: (channelId: string) => {
    return get().messages[channelId] || [];
  },
}));
