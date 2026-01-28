/**
 * WontanConnect Border Radius System
 * 
 * Consistent radius tokens for rounded corners.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Component-specific radius
export const componentRadius = {
  button: radius.lg,
  buttonSmall: radius.md,
  card: radius.xl,
  input: radius.lg,
  tag: radius.md,
  avatar: radius.full,
  modal: radius['2xl'],
  bottomSheet: radius['3xl'],
} as const;

export type RadiusToken = keyof typeof radius;
