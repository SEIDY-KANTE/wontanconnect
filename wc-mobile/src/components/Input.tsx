/**
 * Input Component
 * 
 * Text input with label, helper text, and error states.
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { duration } from '@/design/tokens/animation';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  ...textInputProps
}) => {
  const focusAnim = useSharedValue(0);
  const hasLeftIcon = leftIcon !== null && leftIcon !== undefined;
  const hasRightIcon = rightIcon !== null && rightIcon !== undefined;

  const handleFocus = useCallback(() => {
    focusAnim.value = withTiming(1, { duration: duration.fast });
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    focusAnim.value = withTiming(0, { duration: duration.fast });
  }, [focusAnim]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.error.main
      : focusAnim.value === 1
      ? colors.primary[500]
      : colors.border.light,
    borderWidth: focusAnim.value === 1 ? 2 : 1,
  }));

  const hasError = Boolean(error);
  const showHelperText = helperText && !hasError;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, hasError && styles.errorLabel]}>
          {label}
        </Text>
      )}
      
      <Animated.View style={[styles.inputContainer, animatedBorderStyle]}>
        {hasLeftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            hasLeftIcon && styles.inputWithLeftIcon,
            hasRightIcon && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />
        
        {hasRightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>
      
      {(hasError || showHelperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {hasError ? error : helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  errorLabel: {
    color: colors.error.main,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.base,
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  leftIcon: {
    paddingLeft: spacing.base,
  },
  rightIcon: {
    paddingRight: spacing.base,
  },
  helperText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.error.main,
  },
});
