/** Shared shape for both light and dark palettes */
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  orange: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  bg: string;
  bgCard: string;
  bgCardHover: string;
  bgElevated: string;
  bgInput: string;
  bgGradientStart: string;
  bgGradientMid: string;
  bgGradientEnd: string;
  text: string;
  textLight: string;
  textBright: string;
  heading: string;
  border: string;
  borderHover: string;
  transparent: string;
  white: string;
  black: string;
  gold: string;
  goldLight: string;
}

export const lightColors: ThemeColors = {
  primary: '#7B2D3E',
  primaryDark: '#5E1F2E',
  primaryLight: 'rgba(123, 45, 62, 0.12)',
  accent: '#C5A55A',
  accentLight: 'rgba(197, 165, 90, 0.12)',
  orange: '#ff6b35',
  success: '#2A9D5C',
  successLight: 'rgba(42, 157, 92, 0.1)',
  danger: '#C44040',
  dangerLight: 'rgba(196, 64, 64, 0.1)',
  warning: '#FF9500',

  bg: '#FFFFFF',
  bgCard: '#F9F7F4',
  bgCardHover: '#F2EDE6',
  bgElevated: '#F2EDE6',
  bgInput: '#F9F7F4',

  /** Liquid Glass gradient stops (top -> bottom) */
  bgGradientStart: '#F3EDE8',
  bgGradientMid: '#EDE5DF',
  bgGradientEnd: '#F8F5F2',

  text: '#4A4440',
  textLight: '#7A7470',
  textBright: '#1A1A1A',
  heading: '#1A1A1A',

  border: '#E8E2D9',
  borderHover: 'rgba(123, 45, 62, 0.3)',

  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',

  gold: '#C5A55A',
  goldLight: '#D4BA7A',
};

export const darkColors: ThemeColors = {
  primary: '#E8577A',
  primaryDark: '#C43E5E',
  primaryLight: 'rgba(232, 87, 122, 0.15)',
  accent: '#F0C95D',
  accentLight: 'rgba(240, 201, 93, 0.15)',
  orange: '#FF8A5C',
  success: '#3EDC84',
  successLight: 'rgba(62, 220, 132, 0.12)',
  danger: '#FF5B5B',
  dangerLight: 'rgba(255, 91, 91, 0.12)',
  warning: '#FFB347',

  bg: '#0A0A10',
  bgCard: '#16161F',
  bgCardHover: '#1E1E2A',
  bgElevated: '#1E1E2A',
  bgInput: '#16161F',

  bgGradientStart: '#0E0E16',
  bgGradientMid: '#0A0A10',
  bgGradientEnd: '#12121A',

  text: '#EEEAE6',
  textLight: '#7A7685',
  textBright: '#FFFFFF',
  heading: '#EEEAE6',

  border: '#2A2A38',
  borderHover: 'rgba(232, 87, 122, 0.35)',

  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',

  gold: '#F0C95D',
  goldLight: '#F5D98A',
};

/** Default export — dark theme (app default) */
export const colors = darkColors;

export type ColorName = keyof ThemeColors;
