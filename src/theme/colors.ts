export const colors = {
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

  /** Liquid Glass gradient stops (top → bottom) */
  bgGradientStart: '#F3EDE8',
  bgGradientMid: '#EDE5DF',
  bgGradientEnd: '#F8F5F2',

  text: '#4A4440',
  textLight: '#8A837D',
  textBright: '#1A1A1A',
  heading: '#1A1A1A',

  border: '#E8E2D9',
  borderHover: 'rgba(123, 45, 62, 0.3)',

  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',

  gold: '#C5A55A',
  goldLight: '#D4BA7A',
} as const;

export type ColorName = keyof typeof colors;
