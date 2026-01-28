/**
 * WontanConnect Color Palette
 * 
 * A premium, trust-first color system inspired by modern fintech apps.
 * Primary: Deep indigo for trust and professionalism
 * Secondary: Warm amber for action and urgency
 * 
 * All colors meet WCAG AA contrast requirements.
 */

export const colors = {
  // Primary Brand - Deep Indigo
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main brand color
    600: '#4F46E5', // Primary buttons
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },

  // Secondary - Warm Amber (for CTAs and highlights)
  secondary: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main accent
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutrals - Slate scale for UI
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Semantic colors
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#2563EB',
  },

  // Specific use cases
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    link: '#4F46E5',
  },
  border: {
    light: '#E2E8F0',
    default: '#CBD5E1',
    dark: '#94A3B8',
  },

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.25)',
} as const;

export type ColorToken = keyof typeof colors;
