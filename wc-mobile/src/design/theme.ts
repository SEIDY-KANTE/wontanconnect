/**
 * WontanConnect Theme
 * 
 * Unified theme object combining all design tokens.
 */

import { colors } from './tokens/colors';
import { spacing, screenPadding, componentSpacing } from './tokens/spacing';
import { typography, fontFamily, fontWeight, fontSize } from './tokens/typography';
import { radius, componentRadius } from './tokens/radius';
import { shadows, coloredShadows } from './tokens/shadows';
import { duration, easing, springConfig, scale } from './tokens/animation';

export const theme = {
  colors,
  spacing,
  screenPadding,
  componentSpacing,
  typography,
  fontFamily,
  fontWeight,
  fontSize,
  radius,
  componentRadius,
  shadows,
  coloredShadows,
  animation: {
    duration,
    easing,
    springConfig,
    scale,
  },
} as const;

export type Theme = typeof theme;

// Commonly used styles
export const commonStyles = {
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  // Centered content
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  // Row with space between
  rowBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  
  // Row with center alignment
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  // Standard card
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: componentRadius.card,
    padding: componentSpacing.cardPadding,
    ...shadows.md,
  },
  
  // Input field
  inputField: {
    height: 52,
    borderRadius: componentRadius.input,
    paddingHorizontal: componentSpacing.inputPadding,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
} as const;
