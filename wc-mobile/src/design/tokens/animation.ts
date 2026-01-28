/**
 * WontanConnect Animation System
 * 
 * Timing and easing constants for consistent animations.
 */

import { Easing } from 'react-native-reanimated';

// Duration in milliseconds
export const duration = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 750,
} as const;

// Easing curves
export const easing = {
  // Standard ease for most transitions
  standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  
  // Ease out for entering elements
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  
  // Ease in for exiting elements
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  
  // Bounce effect for playful interactions
  bounce: Easing.bezier(0.175, 0.885, 0.32, 1.275),
  
  // Smooth for subtle movements
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1.0),
} as const;

// Spring configurations for react-native-reanimated
export const springConfig = {
  // Gentle spring for subtle animations
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1,
  },
  
  // Bouncy spring for playful animations
  bouncy: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  },
  
  // Stiff spring for quick snaps
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 1,
  },
  
  // Soft spring for smooth transitions
  soft: {
    damping: 30,
    stiffness: 100,
    mass: 1,
  },
} as const;

// Animation scale values
export const scale = {
  pressed: 0.97,
  hover: 1.02,
  normal: 1,
} as const;

export type DurationToken = keyof typeof duration;
export type SpringConfigToken = keyof typeof springConfig;
