import { create } from 'zustand';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { upsertProfile, fetchProfile } from '../services/projectService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
  syncProfile: (authUser: { id: string; name: string; phone?: string }) => Promise<void>;
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
}));
