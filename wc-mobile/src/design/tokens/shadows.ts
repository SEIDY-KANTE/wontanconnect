/**
 * WontanConnect Shadow System
 * 
 * Subtle, premium shadows for depth and elevation.
 */

import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

const createShadow = (
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number
): ShadowStyle => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
  shadowRadius: blur,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const shadows = {
  none: createShadow(0, 0, 0, 0),
  
  // Subtle - for cards, list items
  sm: createShadow(1, 2, 0.05, 1),
  
  // Default - for interactive cards
  md: createShadow(2, 4, 0.08, 2),
  
  // Raised - for FABs, popovers
  lg: createShadow(4, 8, 0.1, 4),
  
  // High - for modals, bottom sheets
  xl: createShadow(8, 16, 0.12, 8),
  
  // Extreme - for floating elements
  '2xl': createShadow(12, 24, 0.15, 12),
} as const;

// Colored shadows for premium feel
export const coloredShadows = {
  primary: (opacity = 0.25): ShadowStyle => ({
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 4 : 0,
  }),
  secondary: (opacity = 0.25): ShadowStyle => ({
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 4 : 0,
  }),
  success: (opacity = 0.25): ShadowStyle => ({
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 4 : 0,
  }),
};

export type ShadowToken = keyof typeof shadows;
