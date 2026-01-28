/**
 * Typing Indicator Component
 *
 * Shows animated dots when another user is typing.
 */

import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

interface TypingIndicatorProps {
  userName?: string;
  visible: boolean;
}

const AnimatedDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName,
  visible,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={150} />
          <AnimatedDot delay={300} />
        </View>
      </View>
      {userName && <Text style={styles.text}>{userName} is typing...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  bubble: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    borderBottomLeftRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.tertiary,
  },
  text: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: "italic",
  },
});
