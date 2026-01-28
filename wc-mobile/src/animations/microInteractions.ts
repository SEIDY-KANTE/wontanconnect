/**
 * Animation Utilities
 *
 * Micro-interactions and animation primitives using react-native-reanimated.
 *
 * WHY: Professional apps need smooth, delightful animations.
 * HOW: Reusable hooks for common animation patterns.
 * VERIFY: Test animations on real device (60fps), verify haptic feedback.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolate,
  Easing,
  runOnJS,
  cancelAnimation,
  type SharedValue,
  type AnimatedStyle,
} from "react-native-reanimated";
import { useCallback, useEffect } from "react";
import { ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const SPRING_CONFIGS = {
  /**
   * Gentle spring for subtle movements
   */
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },

  /**
   * Snappy spring for quick responses
   */
  snappy: {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  },

  /**
   * Bouncy spring for playful animations
   */
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
  },

  /**
   * Stiff spring for immediate response
   */
  stiff: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },

  /**
   * Slow spring for dramatic effect
   */
  slow: {
    damping: 25,
    stiffness: 50,
    mass: 1.5,
  },
} as const;

export const TIMING_CONFIGS = {
  fast: { duration: 150, easing: Easing.out(Easing.ease) },
  normal: { duration: 300, easing: Easing.out(Easing.ease) },
  slow: { duration: 500, easing: Easing.out(Easing.ease) },
  bounce: { duration: 400, easing: Easing.bounce },
} as const;

// ============================================================================
// SCALE ANIMATION
// ============================================================================

export interface UseScaleAnimationOptions {
  initialScale?: number;
  pressedScale?: number;
  springConfig?: typeof SPRING_CONFIGS.snappy;
}

export function useScaleAnimation(options: UseScaleAnimationOptions = {}) {
  const {
    initialScale = 1,
    pressedScale = 0.95,
    springConfig = SPRING_CONFIGS.snappy,
  } = options;

  const scale = useSharedValue(initialScale);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = useCallback(() => {
    scale.value = withSpring(pressedScale, springConfig);
  }, [pressedScale, springConfig]);

  const pressOut = useCallback(() => {
    scale.value = withSpring(initialScale, springConfig);
  }, [initialScale, springConfig]);

  return { animatedStyle, pressIn, pressOut, scale };
}

// ============================================================================
// SHAKE ANIMATION
// ============================================================================

export function useShakeAnimation(intensity = 10) {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-intensity, { duration: 50 }),
      withTiming(intensity, { duration: 50 }),
      withTiming(-intensity, { duration: 50 }),
      withTiming(intensity, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [intensity]);

  return { animatedStyle, shake };
}

// ============================================================================
// FADE ANIMATION
// ============================================================================

export interface UseFadeAnimationOptions {
  initialOpacity?: number;
  duration?: number;
}

export function useFadeAnimation(options: UseFadeAnimationOptions = {}) {
  const { initialOpacity = 0, duration = 300 } = options;

  const opacity = useSharedValue(initialOpacity);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fadeIn = useCallback(() => {
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.ease),
    });
  }, [duration]);

  const fadeOut = useCallback(() => {
    opacity.value = withTiming(0, { duration, easing: Easing.in(Easing.ease) });
  }, [duration]);

  const fadeToggle = useCallback(() => {
    opacity.value = withTiming(opacity.value > 0.5 ? 0 : 1, { duration });
  }, [duration]);

  return { animatedStyle, fadeIn, fadeOut, fadeToggle, opacity };
}

// ============================================================================
// SLIDE ANIMATION
// ============================================================================

export type SlideDirection = "left" | "right" | "up" | "down";

export interface UseSlideAnimationOptions {
  direction?: SlideDirection;
  distance?: number;
  duration?: number;
}

export function useSlideAnimation(options: UseSlideAnimationOptions = {}) {
  const { direction = "up", distance = 100, duration = 300 } = options;

  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX =
      direction === "left"
        ? interpolate(progress.value, [0, 1], [-distance, 0])
        : direction === "right"
          ? interpolate(progress.value, [0, 1], [distance, 0])
          : 0;

    const translateY =
      direction === "up"
        ? interpolate(progress.value, [0, 1], [distance, 0])
        : direction === "down"
          ? interpolate(progress.value, [0, 1], [-distance, 0])
          : 0;

    return {
      transform: [{ translateX }, { translateY }],
      opacity: progress.value,
    };
  });

  const slideIn = useCallback(() => {
    progress.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.ease),
    });
  }, [duration]);

  const slideOut = useCallback(() => {
    progress.value = withTiming(0, {
      duration,
      easing: Easing.in(Easing.ease),
    });
  }, [duration]);

  return { animatedStyle, slideIn, slideOut, progress };
}

// ============================================================================
// PULSE ANIMATION
// ============================================================================

export function usePulseAnimation(minScale = 0.95, maxScale = 1.05) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startPulsing = useCallback(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 500 }),
        withTiming(minScale, { duration: 500 }),
      ),
      -1, // Repeat infinitely
      true, // Reverse
    );
  }, [minScale, maxScale]);

  const stopPulsing = useCallback(() => {
    cancelAnimation(scale);
    scale.value = withSpring(1, SPRING_CONFIGS.gentle);
  }, []);

  return { animatedStyle, startPulsing, stopPulsing };
}

// ============================================================================
// ROTATION ANIMATION
// ============================================================================

export function useRotationAnimation() {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const rotate = useCallback((degrees: number, duration = 300) => {
    rotation.value = withTiming(rotation.value + degrees, { duration });
  }, []);

  const spin = useCallback(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const stopSpin = useCallback(() => {
    cancelAnimation(rotation);
    rotation.value = 0;
  }, []);

  return { animatedStyle, rotate, spin, stopSpin, rotation };
}

// ============================================================================
// BOUNCE ANIMATION
// ============================================================================

export function useBounceAnimation() {
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bounce = useCallback(() => {
    translateY.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withSpring(0, SPRING_CONFIGS.bouncy),
    );
  }, []);

  const startBouncing = useCallback(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const stopBouncing = useCallback(() => {
    cancelAnimation(translateY);
    translateY.value = withSpring(0, SPRING_CONFIGS.gentle);
  }, []);

  return { animatedStyle, bounce, startBouncing, stopBouncing };
}

// ============================================================================
// STAGGER ANIMATION (for lists)
// ============================================================================

export function useStaggerAnimation(itemCount: number, delayBetween = 50) {
  const getDelayedAnimation = useCallback(
    (index: number, animation: () => number) => {
      "worklet";
      return withDelay(index * delayBetween, animation());
    },
    [delayBetween],
  );

  return { getDelayedAnimation };
}

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};

// ============================================================================
// COMBINED PRESS ANIMATION WITH HAPTICS
// ============================================================================

export interface UsePressAnimationOptions {
  hapticOnPress?: boolean;
  hapticType?: keyof typeof haptics;
  scaleConfig?: UseScaleAnimationOptions;
}

export function usePressAnimation(options: UsePressAnimationOptions = {}) {
  const { hapticOnPress = true, hapticType = "light", scaleConfig } = options;

  const { animatedStyle, pressIn, pressOut } = useScaleAnimation(scaleConfig);

  const handlePressIn = useCallback(() => {
    pressIn();
    if (hapticOnPress) {
      haptics[hapticType]();
    }
  }, [pressIn, hapticOnPress, hapticType]);

  return {
    animatedStyle,
    pressIn: handlePressIn,
    pressOut,
  };
}

// ============================================================================
// ENTER/EXIT ANIMATIONS
// ============================================================================

export type EnterAnimation =
  | "fadeIn"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "zoomIn";
export type ExitAnimation =
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "zoomOut";

export function useEnterExitAnimation(
  enter: EnterAnimation = "fadeIn",
  exit: ExitAnimation = "fadeOut",
  duration = 300,
) {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    let transforms: ViewStyle["transform"] = [];
    let opacity = 1;

    switch (enter) {
      case "fadeIn":
        opacity = progress.value;
        break;
      case "slideUp":
        transforms.push({
          translateY: interpolate(progress.value, [0, 1], [50, 0]),
        });
        opacity = progress.value;
        break;
      case "slideDown":
        transforms.push({
          translateY: interpolate(progress.value, [0, 1], [-50, 0]),
        });
        opacity = progress.value;
        break;
      case "slideLeft":
        transforms.push({
          translateX: interpolate(progress.value, [0, 1], [50, 0]),
        });
        opacity = progress.value;
        break;
      case "slideRight":
        transforms.push({
          translateX: interpolate(progress.value, [0, 1], [-50, 0]),
        });
        opacity = progress.value;
        break;
      case "zoomIn":
        transforms.push({
          scale: interpolate(progress.value, [0, 1], [0.8, 1]),
        });
        opacity = progress.value;
        break;
    }

    return {
      transform: transforms.length > 0 ? transforms : undefined,
      opacity,
    };
  });

  const animateIn = useCallback(() => {
    progress.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.ease),
    });
  }, [duration]);

  const animateOut = useCallback(
    (onComplete?: () => void) => {
      progress.value = withTiming(
        0,
        { duration, easing: Easing.in(Easing.ease) },
        () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        },
      );
    },
    [duration],
  );

  // Auto animate in on mount
  useEffect(() => {
    animateIn();
  }, []);

  return { animatedStyle, animateIn, animateOut, progress };
}
