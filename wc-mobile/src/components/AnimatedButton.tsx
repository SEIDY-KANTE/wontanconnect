/**
 * Animated Button Component
 *
 * Production-ready button with scale animation and haptic feedback.
 *
 * WHY: Default TouchableOpacity is boring; animations add delight.
 * HOW: Scale animation on press with haptic feedback.
 * VERIFY: Press button, feel haptic, see smooth scale animation.
 */

import React, { useMemo } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import Animated from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePressAnimation } from "@/animations/microInteractions";

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "small" | "medium" | "large";

export interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  hapticFeedback?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; text: string; border?: string }
> = {
  primary: { bg: "#2196F3", text: "#FFFFFF" },
  secondary: { bg: "#757575", text: "#FFFFFF" },
  outline: { bg: "transparent", text: "#2196F3", border: "#2196F3" },
  ghost: { bg: "transparent", text: "#2196F3" },
  danger: { bg: "#F44336", text: "#FFFFFF" },
};

const SIZES: Record<
  ButtonSize,
  { height: number; paddingH: number; fontSize: number; iconSize: number }
> = {
  small: { height: 32, paddingH: 12, fontSize: 12, iconSize: 16 },
  medium: { height: 44, paddingH: 20, fontSize: 14, iconSize: 20 },
  large: { height: 56, paddingH: 28, fontSize: 16, iconSize: 24 },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  hapticFeedback = true,
  style,
  textStyle,
  testID,
}) => {
  const { animatedStyle, pressIn, pressOut } = usePressAnimation({
    hapticOnPress: hapticFeedback && !disabled && !loading,
    hapticType: "light",
    scaleConfig: { pressedScale: 0.97 },
  });

  const variantConfig = VARIANTS[variant];
  const sizeConfig = SIZES[size];

  const buttonStyle = useMemo<ViewStyle[]>(
    () => [
      styles.button,
      {
        backgroundColor: variantConfig.bg,
        height: sizeConfig.height,
        paddingHorizontal: sizeConfig.paddingH,
        borderRadius: sizeConfig.height / 2, // Pill shape
        ...(variantConfig.border && {
          borderWidth: 2,
          borderColor: variantConfig.border,
        }),
        ...(fullWidth && { alignSelf: "stretch" }),
        ...(disabled && styles.disabled),
      },
      style,
    ],
    [variantConfig, sizeConfig, fullWidth, disabled, style],
  );

  const textStyles = useMemo<TextStyle[]>(
    () => [
      styles.text,
      {
        color: variantConfig.text,
        fontSize: sizeConfig.fontSize,
        ...(disabled && { opacity: 0.5 }),
      },
      textStyle,
    ],
    [variantConfig.text, sizeConfig.fontSize, disabled, textStyle],
  );

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={variantConfig.text} />;
    }

    return (
      <>
        {icon && iconPosition === "left" && (
          <MaterialCommunityIcons
            name={icon as any}
            size={sizeConfig.iconSize}
            color={variantConfig.text}
            style={styles.iconLeft}
          />
        )}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === "right" && (
          <MaterialCommunityIcons
            name={icon as any}
            size={sizeConfig.iconSize}
            color={variantConfig.text}
            style={styles.iconRight}
          />
        )}
      </>
    );
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={buttonStyle}
        testID={testID}
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// ICON ONLY BUTTON
// ============================================================================

export interface AnimatedIconButtonProps {
  onPress: () => void;
  icon: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const AnimatedIconButton: React.FC<AnimatedIconButtonProps> = ({
  onPress,
  icon,
  size = "medium",
  variant = "ghost",
  disabled = false,
  loading = false,
  hapticFeedback = true,
  style,
  testID,
}) => {
  const { animatedStyle, pressIn, pressOut } = usePressAnimation({
    hapticOnPress: hapticFeedback && !disabled,
    hapticType: "light",
  });

  const variantConfig = VARIANTS[variant];
  const sizeConfig = SIZES[size];

  const buttonSize = sizeConfig.height;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={!disabled && !loading ? onPress : undefined}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[
          styles.iconButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: variantConfig.bg,
            ...(variantConfig.border && {
              borderWidth: 2,
              borderColor: variantConfig.border,
            }),
            ...(disabled && styles.disabled),
          },
          style,
        ]}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantConfig.text} />
        ) : (
          <MaterialCommunityIcons
            name={icon as any}
            size={sizeConfig.iconSize}
            color={disabled ? "#9E9E9E" : variantConfig.text}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
