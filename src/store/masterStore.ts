import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  MasterSetupData,
  PortfolioProject,
  MasterPricing,
  VerificationStatus,
  SkillLevel,
  ExperienceRange,
} from '../types';
import type { SpecializationId } from '../data/specializations';

// AsyncStorage keys
const WELCOME_SEEN_KEY = 'master_welcome_seen';
const SETUP_DRAFT_KEY = 'master_setup_draft';
const SETUP_COMPLETE_KEY = 'master_setup_complete';
const MASTER_PROFILE_KEY = 'master_profile';

export interface MasterProfile {
  specializations: SpecializationId[];
  experience: ExperienceRange;
  about: string;
  skill_level: SkillLevel;
  portfolio: PortfolioProject[];
  pricing: MasterPricing[];
  certificates: string[];
  verification_status: VerificationStatus;
  jump_contractor_id: string | null;
  rating: number;
  reviews_count: number;
  completed_tasks: number;
}

interface MasterState {
  // Welcome slides
  welcomeSeen: boolean;
  // Setup wizard
  setupComplete: boolean;
  setupDraft: Partial<MasterSetupData> | null;
  // Profile data
  profile: MasterProfile | null;
  isLoading: boolean;

  // Actions
  init: (userId: string) => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  saveDraft: (draft: Partial<MasterSetupData>) => Promise<void>;
  completeSetup: (data: MasterSetupData) => Promise<void>;
  updateProfile: (updates: Partial<MasterProfile>) => Promise<void>;
  setVerificationStatus: (status: VerificationStatus) => Promise<void>;
  addPortfolioProject: (project: PortfolioProject) => Promise<void>;
  removePortfolioProject: (projectId: string) => Promise<void>;
  updatePricing: (pricing: MasterPricing[]) => Promise<void>;
}

const DEFAULT_PROFILE: MasterProfile = {
  specializations: [],
  experience: '1_3',
  about: '',
  skill_level: 'experienced',
  portfolio: [],
  pricing: [],
  certificates: [],
  verification_status: 'none',
  jump_contractor_id: null,
  rating: 0,
  reviews_count: 0,
  completed_tasks: 0,
};

export const useMasterStore = create<MasterState>((set, get) => ({
  welcomeSeen: false,
  setupComplete: false,
  setupDraft: null,
  profile: null,
  isLoading: false,

  init: async (userId: string) => {
    set({ isLoading: true });
    try {
      const [welcomeSeen, setupComplete, draftJson, profileJson] = await Promise.all([
        AsyncStorage.getItem(WELCOME_SEEN_KEY),
        AsyncStorage.getItem(SETUP_COMPLETE_KEY),
        AsyncStorage.getItem(SETUP_DRAFT_KEY),
        AsyncStorage.getItem(MASTER_PROFILE_KEY),
      ]);

      set({
        welcomeSeen: welcomeSeen === 'true',
        setupComplete: setupComplete === 'true',
        setupDraft: draftJson ? JSON.parse(draftJson) : null,
        profile: profileJson ? JSON.parse(profileJson) : (setupComplete === 'true' ? DEFAULT_PROFILE : null),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markWelcomeSeen: async () => {
    set({ welcomeSeen: true });
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
  },

  saveDraft: async (draft: Partial<MasterSetupData>) => {
    const current = get().setupDraft || {};
    const merged = { ...current, ...draft };
    set({ setupDraft: merged });
    await AsyncStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(merged));
  },

  completeSetup: async (data: MasterSetupData) => {
    const profile: MasterProfile = {
      specializations: data.specializations,
      experience: data.experience,
      about: data.about,
      skill_level: data.skill_level,
      portfolio: data.portfolio,
      pricing: data.pricing,
      certificates: data.certificates,
      verification_status: 'none',
      jump_contractor_id: null,
      rating: 0,
      reviews_count: 0,
      completed_tasks: 0,
    };

    set({
      setupComplete: true,
      setupDraft: null,
      profile,
    });

    await Promise.all([
      AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true'),
      AsyncStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(profile)),
      AsyncStorage.removeItem(SETUP_DRAFT_KEY),
    ]);
  },

  updateProfile: async (updates: Partial<MasterProfile>) => {
    const current = get().profile || DEFAULT_PROFILE;
    const updated = { ...current, ...updates };
    set({ profile: updated });
    await AsyncStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(updated));
  },

  setVerificationStatus: async (status: VerificationStatus) => {
    const current = get().profile || DEFAULT_PROFILE;
    const updated = { ...current, verification_status: status };
    set({ profile: updated });
    await AsyncStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(updated));
  },

  addPortfolioProject: async (project: PortfolioProject) => {
    const current = get().profile || DEFAULT_PROFILE;
    const updated = { ...current, portfolio: [project, ...current.portfolio] };
    set({ profile: updated });
    await AsyncStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(updated));
  },

  removePortfolioProject: async (projectId: string) => {
    const current = get().profile || DEFAULT_PROFILE;
    const updated = { ...current, portfolio: current.portfolio.filter((p) => p.id !== projectId) };
    set({ profile: updated });
    await AsyncStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(updated));
  },

  updatePricing: async (pricing: MasterPricing[]) => {
    const current = get().profile || DEFAULT_PROFILE;
    const updated = { ...current, pricing };
    set({ profile: updated });
    await AsyncStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(updated));
  },
}));
