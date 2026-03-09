import { create } from 'zustand';
import { User, UserRole, SupportedLanguage } from '../types';
import { supabase } from '../lib/supabase';
import { upsertProfile, updateProfile, fetchProfile } from '../services/projectService';
import { useMasterStore } from './masterStore';
import { flushAnalytics } from '../services/analyticsService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
  syncProfile: (authUser: { id: string; name: string; phone?: string; city?: string; consent_version?: string }) => Promise<void>;
  saveProfile: (updates: { name?: string; phone?: string; city?: string; preferred_language?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

/** Build a User object from a Supabase profile row */
function profileToUser(profile: any): User {
  return {
    id: profile.id,
    phone: profile.phone || '',
    name: profile.name || '',
    role: profile.role as UserRole,
    city: profile.city,
    preferred_language: profile.preferred_language as SupportedLanguage | undefined,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    is_active: profile.is_active,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    flushAnalytics();
    supabase.auth.signOut();
    useMasterStore.getState().setActiveView('client');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          set({
            user: profileToUser(profile),
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // Session restore failed
    }
    set({ isLoading: false });
  },

  syncProfile: async ({ id, name, phone, city, consent_version }) => {
    try {
      const extra: Record<string, any> = {};
      if (consent_version) {
        extra.consent_given_at = new Date().toISOString();
        extra.consent_version = consent_version;
      }
      await upsertProfile({ id, name, phone, city, role: 'client', ...extra });
      const profile = await fetchProfile(id);
      if (profile) {
        set({
          user: profileToUser(profile),
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  saveProfile: async (updates) => {
    const state = useAuthStore.getState();
    const user = state.user;
    if (!user) return;

    // Optimistic local update
    set({
      user: {
        ...user,
        ...updates,
      },
    });

    // Dev users (id starts with "dev-") — skip API call
    if (user.id.startsWith('dev-')) return;

    try {
      await updateProfile(user.id, updates);
    } catch {
      // Revert on failure
      set({ user });
      throw new Error('Failed to save profile');
    }
  },

  deleteAccount: async () => {
    const state = useAuthStore.getState();
    const user = state.user;
    if (!user) return;

    // Dev users — just logout locally
    if (user.id.startsWith('dev-')) {
      useMasterStore.getState().setActiveView('client');
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Call delete-account Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('delete-account', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) {
      throw new Error('Failed to delete account');
    }

    // Sign out locally
    await supabase.auth.signOut();
    useMasterStore.getState().setActiveView('client');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
