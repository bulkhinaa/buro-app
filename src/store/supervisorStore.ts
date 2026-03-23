import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { SupervisorProfile, SupervisorSetupData } from '../types';

interface SupervisorState {
  profile: SupervisorProfile | null;
  isLoading: boolean;

  setProfile: (profile: SupervisorProfile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  saveSetupData: (userId: string, data: SupervisorSetupData) => Promise<void>;
}

export const useSupervisorStore = create<SupervisorState>((set) => ({
  profile: null,
  isLoading: false,

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    if (userId.startsWith('dev-')) return;

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('supervisor_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        set({ profile: data as SupervisorProfile });
      }
    } catch {
      // Non-fatal: profile may not exist yet
    } finally {
      set({ isLoading: false });
    }
  },

  saveSetupData: async (userId: string, data: SupervisorSetupData) => {
    if (userId.startsWith('dev-')) return;

    const { error } = await supabase
      .from('supervisor_profiles')
      .upsert(
        {
          id: userId,
          experience: data.experience,
          specializations: data.specializations,
          regions: data.regions,
          address: data.address,
          about: data.about,
        },
        { onConflict: 'id' },
      );

    if (error) throw error;

    // Refresh local state
    const { data: updated } = await supabase
      .from('supervisor_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (updated) {
      set({ profile: updated as SupervisorProfile });
    }
  },
}));
