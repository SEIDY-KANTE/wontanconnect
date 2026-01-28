/**
 * Modal Component
 * 
 * Overlay dialog for confirmations and alerts.
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

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { shadows } from '@/design/tokens/shadows';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'danger';
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  dismissOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  message,
  children,
  primaryAction,
  secondaryAction,
  dismissOnBackdrop = true,
}) => {
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
              entering={SlideInUp.springify().damping(20).stiffness(200)}
              exiting={SlideOutDown.springify().damping(20).stiffness(200)}
              style={styles.container}
            >
              {title && <Text style={styles.title}>{title}</Text>}
              
              {message && <Text style={styles.message}>{message}</Text>}
              
              {children && <View style={styles.content}>{children}</View>}
              
              {(primaryAction || secondaryAction) && (
                <View style={styles.actions}>
                  {secondaryAction && (
                    <Button
                      label={secondaryAction.label}
                      onPress={secondaryAction.onPress}
                      variant="ghost"
                      style={styles.actionButton}
                    />
                  )}
                  {primaryAction && (
                    <Button
                      label={primaryAction.label}
                      onPress={primaryAction.onPress}
                      variant={primaryAction.variant || 'primary'}
                      loading={primaryAction.loading}
                      style={styles.actionButton}
                    />
                  )}
                </View>
              )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    ...shadows.xl,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  content: {
    marginBottom: spacing.base,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
