import { create } from 'zustand';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { upsertProfile, updateProfile, fetchProfile } from '../services/projectService';
import { useMasterStore } from './masterStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
  syncProfile: (authUser: { id: string; name: string; phone?: string }) => Promise<void>;
  saveProfile: (updates: { name?: string; phone?: string; city?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
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
            user: {
              id: profile.id,
              phone: profile.phone || '',
              name: profile.name || '',
              role: profile.role as UserRole,
              city: profile.city,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at,
              is_active: profile.is_active,
            },
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

  syncProfile: async ({ id, name, phone }) => {
    try {
      await upsertProfile({ id, name, phone, role: 'client' });
      const profile = await fetchProfile(id);
      if (profile) {
        set({
          user: {
            id: profile.id,
            phone: profile.phone || '',
            name: profile.name || '',
            role: profile.role as UserRole,
            city: profile.city,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            is_active: profile.is_active,
          },
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
}));
