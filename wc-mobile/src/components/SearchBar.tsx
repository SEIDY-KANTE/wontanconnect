/**
 * SearchBar Component
 * 
 * Search input with icon and clear button.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder,
  ...props
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name="search-outline"
        size={20}
        color={colors.text.tertiary}
        style={styles.icon}
      />
      
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        returnKeyType="search"
        {...props}
      />
      
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    height: '100%',
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
    marginRight: -spacing.xs,
  },
});
