/**
 * WontanConnect Spacing System
 * 
 * Based on 4pt grid system for precision.
 * 8pt multiplier for major spacing.
 */

export const spacing = {
  // Base units (4pt grid)
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
  '8xl': 128,
} as const;

// Screen padding
export const screenPadding = {
  horizontal: spacing.base,
  vertical: spacing.base,
} as const;

// Component-specific spacing
export const componentSpacing = {
  cardPadding: spacing.base,
  cardGap: spacing.md,
  listItemPadding: spacing.base,
  listItemGap: spacing.md,
  sectionGap: spacing.xl,
  inputPadding: spacing.base,
  buttonPadding: {
    horizontal: spacing.xl,
    vertical: spacing.md,
  },
} as const;

export type SpacingToken = keyof typeof spacing;
