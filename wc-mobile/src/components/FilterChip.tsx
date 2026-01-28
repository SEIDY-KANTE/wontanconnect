/**
 * FilterChip Component
 *
 * Removable filter pill.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  style?: ViewStyle;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove, style }) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onRemove}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="close" size={14} color={colors.text.secondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
