/**
 * WontanConnect Gradient Tokens
 */

import { colors } from './colors';

export const gradients = {
  brandSoft: [
    colors.primary[50],
    colors.primary[100],
    colors.background.primary,
  ],
  brandPill: [
    colors.primary[50],
    colors.primary[100],
  ],
} as const;

export type GradientToken = keyof typeof gradients;
