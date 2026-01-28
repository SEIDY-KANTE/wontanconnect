/**
 * Animations Module
 *
 * Production-ready animation utilities for WontanConnect mobile app.
 *
 * EXPORTS:
 * - Micro-interactions: useScaleAnimation, useShakeAnimation, etc.
 * - Screen transitions: screenTransitions presets
 * - Haptic feedback: haptics object
 * - Animation configs: SPRING_CONFIGS, TIMING_CONFIGS
 */

// Micro-interactions and animation hooks
export {
  // Animation hooks
  useScaleAnimation,
  useShakeAnimation,
  useFadeAnimation,
  useSlideAnimation,
  usePulseAnimation,
  useRotationAnimation,
  useBounceAnimation,
  useStaggerAnimation,
  usePressAnimation,
  useEnterExitAnimation,
  // Haptic feedback
  haptics,
  // Animation configurations
  SPRING_CONFIGS,
  TIMING_CONFIGS,
} from "./microInteractions";

// Screen transitions
export {
  // Transition specs
  transitionSpecs,
  // Card style interpolators
  cardStyleInterpolators,
  // Screen transition presets
  screenTransitions,
  // Helper functions
  getScreenOptions,
  createCustomTransition,
  // Types
  type TransitionSpec,
  type CardStyleInterpolator,
  type ScreenTransitionPreset,
} from "./transitions";
