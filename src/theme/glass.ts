import { Platform } from 'react-native';

/**
 * Apple Liquid Glass design tokens
 * Inspired by WWDC 2025 — translucent, refractive surfaces
 */

export interface GlassTokens {
  blur: {
    light: number;
    medium: number;
    heavy: number;
  };
  fill: {
    light: string;
    regular: string;
    subtle: string;
    dark: string;
    tinted: string;
  };
  border: {
    light: string;
    regular: string;
    subtle: string;
    dark: string;
  };
  shadow: Record<string, any>;
  concentricRadius: (outerRadius: number, padding: number) => number;
}

export const lightGlass: GlassTokens = {
  /** Blur intensity for BlurView (expo-blur) */
  blur: {
    light: 25,
    medium: 50,
    heavy: 80,
  },

  /** Semi-transparent fills — Liquid Glass layers */
  fill: {
    /** Bright glass — for overlays on dark images */
    light: 'rgba(255, 255, 255, 0.55)',
    /** Standard glass — for cards, chips */
    regular: 'rgba(255, 255, 255, 0.35)',
    /** Subtle glass — for tab bars, headers */
    subtle: 'rgba(255, 255, 255, 0.18)',
    /** Dark glass — for dark overlays */
    dark: 'rgba(0, 0, 0, 0.12)',
    /** Tinted glass — primary tint */
    tinted: 'rgba(123, 45, 62, 0.08)',
  },

  /** Borders for glass surfaces */
  border: {
    light: 'rgba(255, 255, 255, 0.45)',
    regular: 'rgba(255, 255, 255, 0.25)',
    subtle: 'rgba(255, 255, 255, 0.12)',
    dark: 'rgba(0, 0, 0, 0.06)',
  },

  /** Shadow for glass depth (platform-specific) */
  shadow: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }) as Record<string, any>,

  /** Concentric radius — inner = outer - padding */
  concentricRadius: (outerRadius: number, padding: number) =>
    Math.max(outerRadius - padding, 4),
};

export const darkGlass: GlassTokens = {
  blur: {
    light: 25,
    medium: 50,
    heavy: 80,
  },

  fill: {
    light: 'rgba(255, 255, 255, 0.08)',
    regular: 'rgba(255, 255, 255, 0.05)',
    subtle: 'rgba(255, 255, 255, 0.03)',
    dark: 'rgba(0, 0, 0, 0.35)',
    tinted: 'rgba(232, 87, 122, 0.08)',
  },

  border: {
    light: 'rgba(255, 255, 255, 0.12)',
    regular: 'rgba(255, 255, 255, 0.08)',
    subtle: 'rgba(255, 255, 255, 0.04)',
    dark: 'rgba(0, 0, 0, 0.25)',
  },

  shadow: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }) as Record<string, any>,

  concentricRadius: (outerRadius: number, padding: number) =>
    Math.max(outerRadius - padding, 4),
};

/** Default export — light glass (app default) */
export const glass = lightGlass;
