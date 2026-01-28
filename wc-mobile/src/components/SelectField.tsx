/**
 * SelectField Component
 *
 * Tappable input that opens a bottom sheet with options.
 */

import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { BottomSheet } from './BottomSheet';
import { ListItem } from './ListItem';

export interface SelectOption {
  value: string;
  label: string;
  leftIcon?: React.ReactNode;
}

interface SelectFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  sheetTitle?: string;
  emptyText?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  placeholder,
  value,
  options,
  onSelect,
  disabled = false,
  helperText,
  error,
  sheetTitle,
  emptyText,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const hasError = Boolean(error);
  const showHelperText = helperText && !hasError;

  const displayValue = selectedOption?.label || placeholder || '';

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, hasError && styles.errorLabel]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.inputContainer,
          disabled && styles.disabledContainer,
          hasError && styles.errorContainer,
        ]}
        onPress={handleOpen}
        activeOpacity={0.9}
        disabled={disabled}
        accessibilityRole="button"
      >
        {selectedOption?.leftIcon && (
          <View style={styles.leftIcon}>{selectedOption.leftIcon}</View>
        )}
        <Text
          style={[
            styles.valueText,
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={disabled ? colors.text.tertiary : colors.text.secondary}
        />
      </TouchableOpacity>

      {(hasError || showHelperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {hasError ? error : helperText}
        </Text>
      )}

      <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={sheetTitle || label}
      >
        <ScrollView
          contentContainerStyle={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <ListItem
                key={option.value}
                title={option.label}
                leftIcon={option.leftIcon}
                onPress={() => handleSelect(option.value)}
                showChevron={false}
                rightIcon={
                  isSelected ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary[600]} />
                  ) : undefined
                }
                style={styles.optionItem}
              />
            );
          })}

          {!options.length && emptyText && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )}
        </ScrollView>
      </BottomSheet>
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
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  errorContainer: {
    borderColor: colors.error.main,
  },
  leftIcon: {
    width: 24,
    alignItems: 'center',
  },
  valueText: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.text.tertiary,
  },
  disabledText: {
    color: colors.text.tertiary,
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
  optionsContainer: {
    gap: spacing.xs,
    paddingBottom: spacing.base,
  },
  optionItem: {
    backgroundColor: colors.background.secondary,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
});
