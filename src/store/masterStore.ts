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
const ACTIVE_VIEW_KEY = 'master_active_view';

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
  // Active view for dual-role switching
  activeView: 'client' | 'master';

  // Actions
  init: (userId: string) => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  setActiveView: (view: 'client' | 'master') => Promise<void>;
  saveDraft: (draft: Partial<MasterSetupData>) => Promise<void>;
  completeSetup: (data: MasterSetupData) => Promise<void>;
  updateProfile: (updates: Partial<MasterProfile>) => Promise<void>;
  setVerificationStatus: (status: VerificationStatus) => Promise<void>;
  addPortfolioProject: (project: PortfolioProject) => Promise<void>;
  updatePortfolioProject: (project: PortfolioProject) => Promise<void>;
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
  activeView: 'client',

  init: async (userId: string) => {
    set({ isLoading: true });
    try {
      const [welcomeSeen, setupComplete, draftJson, profileJson, activeViewValue] = await Promise.all([
        AsyncStorage.getItem(WELCOME_SEEN_KEY),
        AsyncStorage.getItem(SETUP_COMPLETE_KEY),
        AsyncStorage.getItem(SETUP_DRAFT_KEY),
        AsyncStorage.getItem(MASTER_PROFILE_KEY),
        AsyncStorage.getItem(ACTIVE_VIEW_KEY),
      ]);

      const isSetupDone = setupComplete === 'true';

      set({
        welcomeSeen: welcomeSeen === 'true',
        setupComplete: isSetupDone,
        setupDraft: draftJson ? JSON.parse(draftJson) : null,
        profile: profileJson ? JSON.parse(profileJson) : (isSetupDone ? DEFAULT_PROFILE : null),
        activeView: (activeViewValue === 'master' && isSetupDone) ? 'master' : 'client',
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

  setActiveView: async (view: 'client' | 'master') => {
    set({ activeView: view });
    await AsyncStorage.setItem(ACTIVE_VIEW_KEY, view);
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
      activeView: 'master',
    });

    await Promise.all([
      AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true'),
      AsyncStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(profile)),
      AsyncStorage.setItem(ACTIVE_VIEW_KEY, 'master'),
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

  updatePortfolioProject: async (project: PortfolioProject) => {
    const current = get().profile || DEFAULT_PROFILE;
    const updated = {
      ...current,
      portfolio: current.portfolio.map((p) => (p.id === project.id ? project : p)),
    };
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
