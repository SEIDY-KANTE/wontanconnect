/**
 * Animated Card Component
 *
 * Production-ready card with enter/exit animations and press effects.
 *
 * WHY: Static cards feel dead; animations bring UI to life.
 * HOW: Fade/slide on mount, scale on press, stagger for lists.
 * VERIFY: Cards animate in smoothly, press effect feels responsive.
 */

import React, { useEffect } from "react";
import { Pressable, View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { SPRING_CONFIGS, TIMING_CONFIGS } from "@/animations/microInteractions";

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = "elevated" | "outlined" | "filled" | "transparent";
export type CardEnterAnimation =
  | "fade"
  | "slideUp"
  | "slideRight"
  | "scale"
  | "none";

export interface AnimatedCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  pressable?: boolean;
  enterAnimation?: CardEnterAnimation;
  staggerIndex?: number; // For list stagger effect
  staggerDelay?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CARD_VARIANTS: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filled: {
    backgroundColor: "#F5F5F5",
  },
  transparent: {
    backgroundColor: "transparent",
  },
};

const DEFAULT_STAGGER_DELAY = 50;

// ============================================================================
// ANIMATED CARD COMPONENT
// ============================================================================

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = "elevated",
  onPress,
  pressable = !!onPress,
  enterAnimation = "slideUp",
  staggerIndex = 0,
  staggerDelay = DEFAULT_STAGGER_DELAY,
  style,
  contentStyle,
  testID,
}) => {
  // Animation values
  const enterProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Calculate stagger delay
  const totalDelay = staggerIndex * staggerDelay;

  // Run enter animation on mount
  useEffect(() => {
    if (enterAnimation !== "none") {
      enterProgress.value = withDelay(
        totalDelay,
        withSpring(1, SPRING_CONFIGS.gentle),
      );
    } else {
      enterProgress.value = 1;
    }
  }, [enterAnimation, totalDelay]);

  // Enter animation style
  const enterAnimatedStyle = useAnimatedStyle(() => {
    if (enterAnimation === "none") {
      return {};
    }

    const opacity = interpolate(
      enterProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );

    let transform: any[] = [];

    switch (enterAnimation) {
      case "fade":
        // Just opacity, no transform
        break;
      case "slideUp":
        transform = [
          {
            translateY: interpolate(
              enterProgress.value,
              [0, 1],
              [20, 0],
              Extrapolation.CLAMP,
            ),
          },
        ];
        break;
      case "slideRight":
        transform = [
          {
            translateX: interpolate(
              enterProgress.value,
              [0, 1],
              [-20, 0],
              Extrapolation.CLAMP,
            ),
          },
        ];
        break;
      case "scale":
        transform = [
          {
            scale: interpolate(
              enterProgress.value,
              [0, 1],
              [0.9, 1],
              Extrapolation.CLAMP,
            ),
          },
        ];
        break;
    }

    return {
      opacity,
      transform: transform.length > 0 ? transform : undefined,
    };
  });

  // Press animation style
  const pressAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  const handlePressIn = () => {
    if (pressable) {
      pressScale.value = withTiming(0.98, TIMING_CONFIGS.quick);
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      pressScale.value = withSpring(1, SPRING_CONFIGS.snappy);
    }
  };

  const cardStyle = [styles.card, CARD_VARIANTS[variant], style];

  const Container = pressable ? Pressable : View;
  const containerProps = pressable
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
      }
    : {};

  return (
    <Animated.View style={[enterAnimatedStyle, pressAnimatedStyle]}>
      <Container {...containerProps} style={cardStyle} testID={testID}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </Container>
    </Animated.View>
  );
};

// ============================================================================
// ANIMATED CARD LIST ITEM
// ============================================================================

export interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Convenience wrapper for AnimatedCard in lists.
 * Automatically applies stagger animation based on index.
 */
export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  onPress,
  style,
  testID,
}) => {
  return (
    <AnimatedCard
      variant="elevated"
      enterAnimation="slideUp"
      staggerIndex={index}
      onPress={onPress}
      style={[styles.listItem, style]}
      testID={testID}
    >
      {children}
    </AnimatedCard>
  );
};

// ============================================================================
// SKELETON CARD
// ============================================================================

export interface SkeletonCardProps {
  height?: number;
  variant?: CardVariant;
  style?: ViewStyle;
}

/**
 * Loading skeleton with shimmer animation.
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 100,
  variant = "outlined",
  style,
}) => {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    const runShimmer = () => {
      shimmerPosition.value = 0;
      shimmerPosition.value = withTiming(1, { duration: 1000 }, () => {
        // Loop the animation
        setTimeout(runShimmer, 200);
      });
    };
    runShimmer();
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        shimmerPosition.value,
        [0, 0.5, 1],
        [0.3, 0.7, 0.3],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Animated.View
      style={[
        styles.card,
        CARD_VARIANTS[variant],
        styles.skeleton,
        { height },
        shimmerStyle,
        style,
      ]}
    />
  );
};

// ============================================================================
// SWIPEABLE CARD
// ============================================================================

export interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Card with swipe-to-reveal actions.
 * Note: For full implementation, consider using react-native-gesture-handler's Swipeable.
 * This is a basic implementation showing the concept.
 */
export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  variant = "elevated",
  style,
  testID,
}) => {
  // Basic implementation - for full swipe support, use react-native-gesture-handler
  return (
    <AnimatedCard variant={variant} style={style} testID={testID}>
      {children}
    </AnimatedCard>
  );
};

// ============================================================================
// COLLAPSIBLE CARD
// ============================================================================

export interface CollapsibleCardProps {
  header: React.ReactNode;
  children: React.ReactNode;
  initialExpanded?: boolean;
  variant?: CardVariant;
  style?: ViewStyle;
  testID?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  header,
  children,
  initialExpanded = false,
  variant = "elevated",
  style,
  testID,
}) => {
  const [expanded, setExpanded] = React.useState(initialExpanded);
  const animatedHeight = useSharedValue(initialExpanded ? 1 : 0);

  const toggleExpanded = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    animatedHeight.value = withSpring(
      newExpanded ? 1 : 0,
      SPRING_CONFIGS.gentle,
    );
  };

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedHeight.value,
      maxHeight: interpolate(
        animatedHeight.value,
        [0, 1],
        [0, 500], // Max height - adjust as needed
        Extrapolation.CLAMP,
      ),
      overflow: "hidden",
    };
  });

  return (
    <View style={[styles.card, CARD_VARIANTS[variant], style]} testID={testID}>
      <Pressable onPress={toggleExpanded} style={styles.collapsibleHeader}>
        {header}
      </Pressable>
      <Animated.View style={contentAnimatedStyle}>
        <View style={styles.collapsibleContent}>{children}</View>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  content: {
    padding: 16,
  },
  listItem: {
    marginBottom: 12,
  },
  skeleton: {
    backgroundColor: "#E0E0E0",
  },
  collapsibleHeader: {
    padding: 16,
  },
  collapsibleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
