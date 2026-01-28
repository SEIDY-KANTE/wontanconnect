/**
 * Divider Component
 * 
 * Simple horizontal divider line.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';

interface DividerProps {
  label?: string;
  spacing?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  spacing: spacingProp = 'md',
  style,
}) => {
  const verticalSpacing = {
    sm: spacing.sm,
    md: spacing.base,
    lg: spacing.xl,
  }[spacingProp];

  if (label) {
    return (
      <View style={[styles.container, { marginVertical: verticalSpacing }, style]}>
        <View style={styles.line} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.simpleLine,
        { marginVertical: verticalSpacing },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.light,
  },
  simpleLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.light,
  },
  label: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginHorizontal: spacing.md,
  },
});
