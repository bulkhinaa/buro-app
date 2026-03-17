import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const CHAT_KEY_PREFIX = 'chat_messages_';

// Stable empty array reference to avoid infinite re-renders in Zustand selectors
const EMPTY_MESSAGES: ChatMessage[] = [];

// ─── Dev mock data ───

const DEV_MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    project_id: 'proj-1',
    sender_id: 'dev-supervisor',
    text: 'Добрый день! Я ваш супервайзер, Михаил. Сегодня провёл проверку — штукатурка стен идёт по графику.',
    created_at: '2026-03-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    project_id: 'proj-1',
    sender_id: 'dev-master',
    text: 'Отлично, спасибо! Завтра заканчиваю штукатурку в коридоре, загружу фото.',
    created_at: '2026-03-15T14:00:00Z',
  },
  {
    id: 'msg-3',
    project_id: 'proj-1',
    sender_id: 'dev-supervisor',
    text: 'Хорошо. Обратите внимание на стыки возле окна — нужно пройти ещё раз.',
    image_url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400',
    created_at: '2026-03-15T16:30:00Z',
  },
];

// Sender info for display (dev-mode only)
export const DEV_SENDER_NAMES: Record<string, string> = {
  'dev-supervisor': 'Михаил (супервайзер)',
  'dev-client': 'Клиент',
  'dev-master': 'Алексей (мастер)',
};

interface ChatState {
  messages: Record<string, ChatMessage[]>; // projectId → messages
  isLoading: boolean;
  activeProjectId: string | null;
  realtimeChannel: RealtimeChannel | null;
  unreadCounts: Record<string, number>; // projectId → unread count

  // Actions
  loadMessages: (projectId: string) => Promise<void>;
  sendMessage: (
    projectId: string,
    userId: string,
    text: string,
    imageUrl?: string,
    replyTo?: string,
  ) => Promise<void>;
  editMessage: (messageId: string, projectId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string, projectId: string) => Promise<void>;
  subscribeRealtime: (projectId: string) => void;
  unsubscribeRealtime: () => void;
  getMessages: (projectId: string) => ChatMessage[];
}

// Helper: check if user is dev
function isDev(userId: string): boolean {
  return userId.startsWith('dev-');
}

// Helper: persist messages to AsyncStorage
async function persistMessages(projectId: string, messages: ChatMessage[]) {
  try {
    await AsyncStorage.setItem(CHAT_KEY_PREFIX + projectId, JSON.stringify(messages));
  } catch {
    // Ignore storage errors
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isLoading: false,
  activeProjectId: null,
  realtimeChannel: null,
  unreadCounts: {},

  loadMessages: async (projectId: string) => {
    set({ isLoading: true, activeProjectId: projectId });

    // Try AsyncStorage cache first (works for both dev and offline)
    try {
      const stored = await AsyncStorage.getItem(CHAT_KEY_PREFIX + projectId);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (parsed.length > 0) {
          set((state) => ({
            messages: { ...state.messages, [projectId]: parsed },
            isLoading: false,
          }));
          // Don't return — continue to try Supabase for fresh data
        }
      }
    } catch {
      // Ignore
    }

    // Try Supabase for real users
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        set((state) => ({
          messages: { ...state.messages, [projectId]: data as ChatMessage[] },
          isLoading: false,
        }));
        await persistMessages(projectId, data as ChatMessage[]);
        return;
      }
    } catch {
      // Supabase not available — use mock data
    }

    // Fallback to mock data for dev users (if not already loaded from cache)
    const current = get().messages[projectId];
    if (!current || current.length === 0) {
      const mockMessages = DEV_MOCK_MESSAGES.filter((m) => m.project_id === projectId);
      if (mockMessages.length > 0) {
        await persistMessages(projectId, mockMessages);
      }
      set((state) => ({
        messages: { ...state.messages, [projectId]: mockMessages },
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
    }
  },

  sendMessage: async (
    projectId: string,
    userId: string,
    text: string,
    imageUrl?: string,
    replyTo?: string,
  ) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      project_id: projectId,
      sender_id: userId,
      text: text.trim() || undefined,
      image_url: imageUrl,
      reply_to: replyTo,
      created_at: new Date().toISOString(),
    };

    // Optimistic local update
    const { messages } = get();
    const existing = messages[projectId] || [];
    const updated = [...existing, newMsg];

    set((state) => ({
      messages: { ...state.messages, [projectId]: updated },
    }));

    await persistMessages(projectId, updated);

    // Send to Supabase for real users
    if (!isDev(userId)) {
      try {
        const insertData: Record<string, unknown> = {
          project_id: projectId,
          sender_id: userId,
        };
        if (text.trim()) insertData.text = text.trim();
        if (imageUrl) insertData.image_url = imageUrl;
        if (replyTo) insertData.reply_to = replyTo;

        const { error } = await supabase.from('chat_messages').insert(insertData);
        if (error) console.warn('Chat send error:', error.message);
      } catch {
        // Already saved locally
      }
    }
  },

  editMessage: async (messageId: string, projectId: string, newText: string) => {
    const { messages } = get();
    const projectMessages = messages[projectId] || [];
    const updated = projectMessages.map((m) =>
      m.id === messageId ? { ...m, text: newText.trim() } : m,
    );

    set((state) => ({
      messages: { ...state.messages, [projectId]: updated },
    }));

    await persistMessages(projectId, updated);

    // Update in Supabase for real users
    const msg = projectMessages.find((m) => m.id === messageId);
    if (msg && !isDev(msg.sender_id)) {
      try {
        await supabase
          .from('chat_messages')
          .update({ text: newText.trim() })
          .eq('id', messageId);
      } catch {
        // Already updated locally
      }
    }
  },

  deleteMessage: async (messageId: string, projectId: string) => {
    const { messages } = get();
    const projectMessages = messages[projectId] || [];
    const msg = projectMessages.find((m) => m.id === messageId);
    const updated = projectMessages.filter((m) => m.id !== messageId);

    set((state) => ({
      messages: { ...state.messages, [projectId]: updated },
    }));

    await persistMessages(projectId, updated);

    // Delete from Supabase for real users
    if (msg && !isDev(msg.sender_id)) {
      try {
        await supabase.from('chat_messages').delete().eq('id', messageId);
      } catch {
        // Already deleted locally
      }
    }
  },

  subscribeRealtime: (projectId: string) => {
    const { realtimeChannel } = get();

    // Unsubscribe from previous channel
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel(`chat:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          const { messages } = get();
          const existing = messages[projectId] || [];
          // Avoid duplicates (optimistic update may already have it)
          if (!existing.find((m) => m.id === newMsg.id)) {
            const updated = [...existing, newMsg];
            set((state) => ({
              messages: { ...state.messages, [projectId]: updated },
            }));
            persistMessages(projectId, updated);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          const { messages } = get();
          const existing = messages[projectId] || [];
          const updated = existing.map((m) =>
            m.id === updatedMsg.id ? updatedMsg : m,
          );
          set((state) => ({
            messages: { ...state.messages, [projectId]: updated },
          }));
          persistMessages(projectId, updated);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (!deletedId) return;
          const { messages } = get();
          const existing = messages[projectId] || [];
          const updated = existing.filter((m) => m.id !== deletedId);
          set((state) => ({
            messages: { ...state.messages, [projectId]: updated },
          }));
          persistMessages(projectId, updated);
        },
      )
      .subscribe();

    set({ realtimeChannel: channel, activeProjectId: projectId });
  },

  unsubscribeRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null, activeProjectId: null });
    }
  },

  getMessages: (projectId: string) => {
    return get().messages[projectId] ?? EMPTY_MESSAGES;
  },
}));
