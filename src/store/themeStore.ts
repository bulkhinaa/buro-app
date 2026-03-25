import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

export type AppTheme = 'dark' | 'light';

interface ThemeState {
  theme: AppTheme;
  isLoaded: boolean;
  setTheme: (theme: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
  init: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  isLoaded: false,

  setTheme: async (theme: AppTheme) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },

  toggleTheme: async () => {
    const next: AppTheme = get().theme === 'dark' ? 'light' : 'dark';
    await AsyncStorage.setItem(THEME_KEY, next);
    set({ theme: next });
  },

  init: async () => {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    const theme: AppTheme = saved === 'light' ? 'light' : 'dark';
    set({ theme, isLoaded: true });
  },
}));
