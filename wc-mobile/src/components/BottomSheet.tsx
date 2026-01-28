/**
 * BottomSheet Component
 *
 * Slide-up sheet for filters and selectors.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal as RNModal,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { shadows } from '@/design/tokens/shadows';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  dismissOnBackdrop?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  dismissOnBackdrop = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissOnBackdrop ? onClose : undefined}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              entering={SlideInUp.springify().damping(20).stiffness(220)}
              exiting={SlideOutDown.springify().damping(20).stiffness(220)}
              style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}
            >
              <View style={styles.handle} />
              {(title || subtitle) && (
                <View style={styles.header}>
                  {title && <Text style={styles.title}>{title}</Text>}
                  {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
              )}
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    maxHeight: '85%',
    ...shadows.lg,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.light,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
});
