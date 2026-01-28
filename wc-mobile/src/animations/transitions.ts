/**
 * Screen Transitions
 *
 * Custom transitions for React Navigation screens.
 *
 * WHY: Default transitions feel generic; custom transitions add polish.
 * HOW: Configure transitionSpec and cardStyleInterpolator per screen.
 * VERIFY: Navigate between screens, verify smooth 60fps transitions.
 */

import { Easing } from "react-native-reanimated";
import type {
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  TransitionSpec,
} from "@react-navigation/stack";

// ============================================================================
// TRANSITION SPECS
// ============================================================================

export const transitionSpecs = {
  /**
   * Standard slide transition (iOS default feel)
   */
  slideFromRight: {
    open: {
      animation: "timing",
      config: {
        duration: 350,
        easing: Easing.out(Easing.poly(4)),
      },
    } as TransitionSpec,
    close: {
      animation: "timing",
      config: {
        duration: 300,
        easing: Easing.in(Easing.poly(4)),
      },
    } as TransitionSpec,
  },

  /**
   * Fast slide for quick actions
   */
  quickSlide: {
    open: {
      animation: "timing",
      config: {
        duration: 250,
        easing: Easing.out(Easing.ease),
      },
    } as TransitionSpec,
    close: {
      animation: "timing",
      config: {
        duration: 200,
        easing: Easing.in(Easing.ease),
      },
    } as TransitionSpec,
  },

  /**
   * Modal-style spring transition
   */
  modalSpring: {
    open: {
      animation: "spring",
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    } as TransitionSpec,
    close: {
      animation: "timing",
      config: {
        duration: 250,
        easing: Easing.out(Easing.poly(4)),
      },
    } as TransitionSpec,
  },

  /**
   * Fade only (no movement)
   */
  fadeOnly: {
    open: {
      animation: "timing",
      config: {
        duration: 300,
        easing: Easing.out(Easing.ease),
      },
    } as TransitionSpec,
    close: {
      animation: "timing",
      config: {
        duration: 250,
        easing: Easing.in(Easing.ease),
      },
    } as TransitionSpec,
  },

  /**
   * Scale and fade (for modals)
   */
  scaleAndFade: {
    open: {
      animation: "spring",
      config: {
        stiffness: 200,
        damping: 20,
        mass: 1,
      },
    } as TransitionSpec,
    close: {
      animation: "timing",
      config: {
        duration: 200,
        easing: Easing.in(Easing.ease),
      },
    } as TransitionSpec,
  },
};

// ============================================================================
// CARD STYLE INTERPOLATORS
// ============================================================================

/**
 * Standard iOS-style slide from right
 */
export const slideFromRight: StackCardStyleInterpolator = ({
  current,
  next,
  layouts,
}: StackCardInterpolationProps) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width, 0],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  // Slight scale for the card behind
  const overlayOpacity = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
      })
    : 0;

  return {
    cardStyle: {
      transform: [{ translateX }],
      opacity,
    },
    overlayStyle: {
      opacity: overlayOpacity,
    },
  };
};

/**
 * Slide from right with fade and slight scale on background
 */
export const slideFromRightWithFade: StackCardStyleInterpolator = ({
  current,
  next,
  layouts,
}: StackCardInterpolationProps) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width, 0],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  const scale = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.95],
      })
    : 1;

  const overlayOpacity = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      })
    : 0;

  return {
    cardStyle: {
      transform: [{ translateX }, { scale }],
      opacity,
    },
    overlayStyle: {
      opacity: overlayOpacity,
    },
  };
};

/**
 * Modal slide from bottom
 */
export const slideFromBottom: StackCardStyleInterpolator = ({
  current,
  layouts,
}: StackCardInterpolationProps) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.height, 0],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  return {
    cardStyle: {
      transform: [{ translateY }],
      opacity,
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      }),
    },
  };
};

/**
 * Scale and fade (good for modals/dialogs)
 */
export const scaleAndFade: StackCardStyleInterpolator = ({
  current,
}: StackCardInterpolationProps) => {
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return {
    cardStyle: {
      transform: [{ scale }],
      opacity,
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      }),
    },
  };
};

/**
 * Fade only (no movement)
 */
export const fadeOnly: StackCardStyleInterpolator = ({
  current,
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      opacity: current.progress,
    },
  };
};

/**
 * Flip horizontal (card flip effect)
 */
export const flipHorizontal: StackCardStyleInterpolator = ({
  current,
  next,
}: StackCardInterpolationProps) => {
  const rotateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["90deg", "0deg"],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  return {
    cardStyle: {
      transform: [{ perspective: 1000 }, { rotateY }],
      opacity,
      backfaceVisibility: "hidden",
    },
  };
};

// ============================================================================
// PRESET SCREEN OPTIONS
// ============================================================================

export const screenTransitions = {
  /**
   * Default screen transition (iOS-like slide)
   */
  default: {
    transitionSpec: transitionSpecs.slideFromRight,
    cardStyleInterpolator: slideFromRight,
  },

  /**
   * Modal presentation (slide from bottom with scale)
   */
  modal: {
    transitionSpec: transitionSpecs.modalSpring,
    cardStyleInterpolator: slideFromBottom,
    presentation: "modal" as const,
  },

  /**
   * Full screen modal (scale and fade)
   */
  fullScreenModal: {
    transitionSpec: transitionSpecs.scaleAndFade,
    cardStyleInterpolator: scaleAndFade,
    presentation: "transparentModal" as const,
  },

  /**
   * Quick transition (for tabs or quick actions)
   */
  quick: {
    transitionSpec: transitionSpecs.quickSlide,
    cardStyleInterpolator: fadeOnly,
  },

  /**
   * Detail view (enhanced slide with background scale)
   */
  detail: {
    transitionSpec: transitionSpecs.slideFromRight,
    cardStyleInterpolator: slideFromRightWithFade,
  },

  /**
   * No animation
   */
  none: {
    animationEnabled: false,
  },
};

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Get screen options for a specific transition type
 */
export function getScreenOptions(
  transitionType: keyof typeof screenTransitions,
) {
  return screenTransitions[transitionType];
}

/**
 * Create custom transition with duration override
 */
export function createCustomTransition(
  baseTransition: keyof typeof screenTransitions,
  duration: number,
) {
  const base = screenTransitions[baseTransition];

  if (!("transitionSpec" in base)) {
    return base;
  }

  return {
    ...base,
    transitionSpec: {
      open: {
        ...base.transitionSpec.open,
        config: {
          ...("config" in base.transitionSpec.open
            ? base.transitionSpec.open.config
            : {}),
          duration,
        },
      },
      close: {
        ...base.transitionSpec.close,
        config: {
          ...("config" in base.transitionSpec.close
            ? base.transitionSpec.close.config
            : {}),
          duration: duration * 0.8,
        },
      },
    },
  };
}
