/**
 * Card Component
 * 
 * Container component with shadow and press animation.
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { radius } from '@/design/tokens/radius';
import { shadows } from '@/design/tokens/shadows';
import { springConfig, scale } from '@/design/tokens/animation';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      pressed.value = withSpring(scale.pressed, springConfig.stiff);
    }
  }, [onPress, pressed]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      pressed.value = withSpring(scale.normal, springConfig.gentle);
    }
  }, [onPress, pressed]);

  const handlePress = useCallback(() => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress]);

  const containerStyle = [
    styles.base,
    styles[`${variant}Variant`],
    styles[`${padding}Padding`],
    style,
  ];

  if (onPress) {
    return (
      <AnimatedTouchable
        style={[containerStyle, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  
  // Variants
  defaultVariant: {
    ...shadows.md,
  },
  elevatedVariant: {
    ...shadows.lg,
  },
  outlinedVariant: {
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.none,
  },
  
  // Padding
  nonePadding: {
    padding: 0,
  },
  smPadding: {
    padding: spacing.sm,
  },
  mdPadding: {
    padding: spacing.base,
  },
  lgPadding: {
    padding: spacing.xl,
  },
});
