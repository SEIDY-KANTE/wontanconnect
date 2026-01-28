/**
 * WontanConnect Typography System
 * 
 * Uses system fonts for optimal performance and native feel.
 * SF Pro on iOS, Roboto on Android.
 */

import { Platform, TextStyle } from 'react-native';

// Font families
export const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
} as const;

// Font weights
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
} as const;

// Font sizes with line heights
export const fontSize = {
  // Display sizes
  displayLarge: { size: 32, lineHeight: 40 },
  displayMedium: { size: 28, lineHeight: 36 },
  displaySmall: { size: 24, lineHeight: 32 },
  
  // Headings
  h1: { size: 24, lineHeight: 32 },
  h2: { size: 20, lineHeight: 28 },
  h3: { size: 18, lineHeight: 26 },
  h4: { size: 16, lineHeight: 24 },
  
  // Body text
  bodyLarge: { size: 16, lineHeight: 24 },
  bodyMedium: { size: 14, lineHeight: 22 },
  bodySmall: { size: 13, lineHeight: 20 },
  
  // Labels and captions
  labelLarge: { size: 14, lineHeight: 20 },
  labelMedium: { size: 12, lineHeight: 18 },
  labelSmall: { size: 11, lineHeight: 16 },
  
  // Caption
  caption: { size: 12, lineHeight: 16 },
  captionSmall: { size: 10, lineHeight: 14 },
} as const;

// Pre-composed typography styles
export const typography: Record<string, TextStyle> = {
  // Display
  displayLarge: {
    fontSize: fontSize.displayLarge.size,
    lineHeight: fontSize.displayLarge.lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: fontSize.displayMedium.size,
    lineHeight: fontSize.displayMedium.lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  displaySmall: {
    fontSize: fontSize.displaySmall.size,
    lineHeight: fontSize.displaySmall.lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.2,
  },
  
  // Headings
  h1: {
    fontSize: fontSize.h1.size,
    lineHeight: fontSize.h1.lineHeight,
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontSize: fontSize.h2.size,
    lineHeight: fontSize.h2.lineHeight,
    fontWeight: fontWeight.semibold,
  },
  h3: {
    fontSize: fontSize.h3.size,
    lineHeight: fontSize.h3.lineHeight,
    fontWeight: fontWeight.semibold,
  },
  h4: {
    fontSize: fontSize.h4.size,
    lineHeight: fontSize.h4.lineHeight,
    fontWeight: fontWeight.medium,
  },
  
  // Body
  bodyLarge: {
    fontSize: fontSize.bodyLarge.size,
    lineHeight: fontSize.bodyLarge.lineHeight,
    fontWeight: fontWeight.regular,
  },
  bodyMedium: {
    fontSize: fontSize.bodyMedium.size,
    lineHeight: fontSize.bodyMedium.lineHeight,
    fontWeight: fontWeight.regular,
  },
  bodySmall: {
    fontSize: fontSize.bodySmall.size,
    lineHeight: fontSize.bodySmall.lineHeight,
    fontWeight: fontWeight.regular,
  },
  
  // Labels
  labelLarge: {
    fontSize: fontSize.labelLarge.size,
    lineHeight: fontSize.labelLarge.lineHeight,
    fontWeight: fontWeight.medium,
  },
  labelMedium: {
    fontSize: fontSize.labelMedium.size,
    lineHeight: fontSize.labelMedium.lineHeight,
    fontWeight: fontWeight.medium,
  },
  labelSmall: {
    fontSize: fontSize.labelSmall.size,
    lineHeight: fontSize.labelSmall.lineHeight,
    fontWeight: fontWeight.medium,
  },
  
  // Caption
  caption: {
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight,
    fontWeight: fontWeight.regular,
  },
  captionSmall: {
    fontSize: fontSize.captionSmall.size,
    lineHeight: fontSize.captionSmall.lineHeight,
    fontWeight: fontWeight.regular,
  },
};

export type TypographyToken = keyof typeof typography;
