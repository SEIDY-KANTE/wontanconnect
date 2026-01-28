/**
 * Toast Component
 * 
 * Notification feedback component with auto-dismiss.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { shadows } from '@/design/tokens/shadows';
import { springConfig } from '@/design/tokens/animation';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

const toastConfig: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; bg: string; iconColor: string }> = {
  success: { icon: 'checkmark-circle', bg: colors.success.dark, iconColor: colors.neutral[0] },
  error: { icon: 'close-circle', bg: colors.error.dark, iconColor: colors.neutral[0] },
  warning: { icon: 'warning', bg: colors.warning.dark, iconColor: colors.neutral[0] },
  info: { icon: 'information-circle', bg: colors.info.dark, iconColor: colors.neutral[0] },
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  type = 'info',
  message,
  duration = 3000,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const config = toastConfig[type];

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springConfig.bouncy);
      
      // Auto dismiss avec setTimeout (compatible Expo Go)
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      dismissTimeoutRef.current = setTimeout(() => {
        translateY.value = withSpring(-100, springConfig.gentle);
        // Petit délai avant d'appeler onDismiss pour laisser l'animation se terminer
        setTimeout(() => {
          onDismiss();
        }, 300);
      }, duration);
    } else {
      translateY.value = withSpring(-100, springConfig.gentle);
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [visible, duration, onDismiss, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.sm, backgroundColor: config.bg },
        animatedStyle,
      ]}
    >
      <Ionicons name={config.icon} size={24} color={config.iconColor} />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    gap: spacing.md,
    zIndex: 9999,
    ...shadows.lg,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.neutral[0],
    flex: 1,
  },
});
