/**
 * Tag / Badge Component
 * 
 * Small label for status indicators, categories, etc.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';

type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type TagSize = 'sm' | 'md';

interface TagProps {
  label: string;
  variant?: TagVariant;
  size?: TagSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const variantColors: Record<TagVariant, { bg: string; text: string }> = {
  default: { bg: colors.neutral[100], text: colors.neutral[700] },
  primary: { bg: colors.primary[100], text: colors.primary[700] },
  success: { bg: colors.success.light, text: colors.success.dark },
  warning: { bg: colors.warning.light, text: colors.warning.dark },
  error: { bg: colors.error.light, text: colors.error.dark },
  info: { bg: colors.info.light, text: colors.info.dark },
};

export const Tag: React.FC<TagProps> = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
}) => {
  const colorScheme = variantColors[variant];

  return (
    <View
      style={[
        styles.container,
        styles[`${size}Container`],
        { backgroundColor: colorScheme.bg },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.label,
          styles[`${size}Label`],
          { color: colorScheme.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  smContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    gap: spacing.xxs,
  },
  mdContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  icon: {
    marginRight: spacing.xxs,
  },
  label: {
    fontWeight: '500',
  },
  smLabel: {
    ...typography.captionSmall,
    fontWeight: '500',
  },
  mdLabel: {
    ...typography.caption,
    fontWeight: '500',
  },
});
