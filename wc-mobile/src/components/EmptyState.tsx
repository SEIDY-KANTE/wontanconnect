/**
 * EmptyState Component
 * 
 * Placeholder for empty lists and screens.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.container, style]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={colors.neutral[300]} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {message && <Text style={styles.message}>{message}</Text>}
      
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.6,
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
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
});
