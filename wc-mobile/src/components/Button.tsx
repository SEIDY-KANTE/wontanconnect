/**
 * Button Component
 * 
 * Primary interactive component with multiple variants.
 * Includes press animation for premium feel.
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
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
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { coloredShadows } from '@/design/tokens/shadows';
import { springConfig, scale } from '@/design/tokens/animation';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}) => {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(scale.pressed, springConfig.stiff);
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(scale.normal, springConfig.gentle);
  }, [pressed]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
    variant === 'primary' && !isDisabled && coloredShadows.primary(0.2),
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`${variant}Label`],
    styles[`${size}Label`],
    isDisabled && styles.disabledLabel,
  ];

  const spinnerColor = variant === 'primary' || variant === 'danger' 
    ? colors.neutral[0] 
    : colors.primary[600];

  return (
    <AnimatedTouchable
      style={[containerStyle, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Animated.View style={styles.iconLeft}>{icon}</Animated.View>
          )}
          <Text style={textStyle}>{label}</Text>
          {icon && iconPosition === 'right' && (
            <Animated.View style={styles.iconRight}>{icon}</Animated.View>
          )}
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Variants
  primaryContainer: {
    backgroundColor: colors.primary[600],
  },
  secondaryContainer: {
    backgroundColor: colors.secondary[500],
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary[600],
  },
  dangerContainer: {
    backgroundColor: colors.error.main,
  },

  // Sizes
  smContainer: {
    height: 36,
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  mdContainer: {
    height: 48,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  lgContainer: {
    height: 56,
    paddingHorizontal: spacing['2xl'],
    gap: spacing.sm,
  },

  // Labels
  label: {
    ...typography.labelLarge,
  },
  primaryLabel: {
    color: colors.neutral[0],
  },
  secondaryLabel: {
    color: colors.neutral[900],
  },
  ghostLabel: {
    color: colors.primary[600],
  },
  outlineLabel: {
    color: colors.primary[600],
  },
  dangerLabel: {
    color: colors.neutral[0],
  },
  smLabel: {
    ...typography.labelMedium,
  },
  mdLabel: {
    ...typography.labelLarge,
  },
  lgLabel: {
    ...typography.bodyLarge,
    fontWeight: '600',
  },

  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  disabledLabel: {
    opacity: 0.7,
  },

  // Icons
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
