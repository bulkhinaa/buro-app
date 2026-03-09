import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadLanguage } from '../i18n';
import { useAuthStore } from './authStore';
import type { SupportedLanguage } from '../types';

const LANGUAGE_KEY = 'app_language';
const LANGUAGE_CHOSEN_KEY = 'hasChosenLanguage';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  flag: string;
}

/** All supported languages with display info */
export const LANGUAGES: LanguageInfo[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uz', name: "O'zbek tili", flag: '🇺🇿' },
  { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
  { code: 'kk', name: 'Қазақ тілі', flag: '🇰🇿' },
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' },
  { code: 'ro', name: 'Română', flag: '🇲🇩' },
];

interface LanguageState {
  language: SupportedLanguage;
  hasChosenLanguage: boolean;
  isLoaded: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  init: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'ru',
  hasChosenLanguage: false,
  isLoaded: false,

  setLanguage: async (lang: SupportedLanguage) => {
    await loadLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await AsyncStorage.setItem(LANGUAGE_CHOSEN_KEY, 'true');
    set({ language: lang, hasChosenLanguage: true });

    // Sync to Supabase profile if authenticated
    const authState = useAuthStore.getState();
    if (authState.user) {
      try {
        await authState.saveProfile({ preferred_language: lang });
      } catch {
        // Non-critical — language is saved locally anyway
      }
    }
  },

  init: async () => {
    const [saved, chosen] = await Promise.all([
      AsyncStorage.getItem(LANGUAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_CHOSEN_KEY),
    ]);

    const lang = (saved as SupportedLanguage) || 'ru';

    if (lang !== 'ru') {
      await loadLanguage(lang);
    }

    set({
      language: lang,
      hasChosenLanguage: chosen === 'true',
      isLoaded: true,
    });
  },
}));
