import React, { createContext, useContext, useMemo } from 'react';
import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors, type ThemeColors } from './colors';
import { lightGlass, darkGlass, type GlassTokens } from './glass';

interface ThemeContextValue {
  isDark: boolean;
  theme: 'dark' | 'light';
  colors: ThemeColors;
  glass: GlassTokens;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  theme: 'dark',
  colors: darkColors,
  glass: darkGlass,
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = theme === 'dark';
    return {
      isDark,
      theme,
      colors: isDark ? darkColors : lightColors,
      glass: isDark ? darkGlass : lightGlass,
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook to access current theme colors and glass tokens reactively */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
