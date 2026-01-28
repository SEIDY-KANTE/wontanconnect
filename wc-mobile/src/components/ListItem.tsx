/**
 * ListItem Component
 * 
 * Reusable list row with icon, text, and action support.
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { springConfig, scale } from '@/design/tokens/animation';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightText,
  onPress,
  showChevron = true,
  disabled = false,
  style,
}) => {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      pressed.value = withSpring(scale.pressed, springConfig.stiff);
    }
  }, [onPress, disabled, pressed]);

  const handlePressOut = useCallback(() => {
    if (onPress && !disabled) {
      pressed.value = withSpring(scale.normal, springConfig.gentle);
    }
  }, [onPress, disabled, pressed]);

  const handlePress = useCallback(() => {
    if (onPress && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress, disabled]);

  const content = (
    <>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, disabled && styles.disabledText]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, disabled && styles.disabledText]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <View style={styles.rightContainer}>
        {rightText && (
          <Text style={styles.rightText}>{rightText}</Text>
        )}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        {showChevron && onPress && !rightIcon && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.tertiary}
          />
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedTouchable
        style={[styles.container, style, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        accessibilityRole="button"
      >
        {content}
      </AnimatedTouchable>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    minHeight: 56,
  },
  leftIcon: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  rightText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
});
