/**
 * Header Component
 * 
 * Screen header with title, back button, and actions.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { shadows } from '@/design/tokens/shadows';
import { gradients } from '@/design/tokens/gradients';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  variant?: 'solid' | 'gradient' | 'transparent';
  transparent?: boolean;
  large?: boolean;
  showDivider?: boolean;
  elevated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  leftAction,
  variant,
  transparent = false,
  large = false,
  showDivider,
  elevated,
}) => {
  const insets = useSafeAreaInsets();
  
  const paddingTop = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || spacing.base;
  const resolvedVariant = variant ?? (transparent ? 'transparent' : 'solid');
  const isTransparent = resolvedVariant === 'transparent';
  const isGradient = resolvedVariant === 'gradient';
  const shouldShowDivider = showDivider ?? !(isTransparent || isGradient);
  const shouldElevate = elevated ?? isGradient;

  const containerStyles = [
    styles.container,
    isTransparent && styles.transparent,
    shouldShowDivider && styles.divider,
    shouldElevate && styles.elevated,
  ];

  const content = (
    <>
      <StatusBar
        barStyle={isTransparent ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={isTransparent ? colors.neutral[0] : colors.text.primary}
              />
            </TouchableOpacity>
          )}
          {leftAction && !showBack && leftAction}
        </View>
        
        <View style={styles.titleContainer}>
          {title && (
            <Text
              style={[
                large ? styles.titleLarge : styles.title,
                isTransparent && styles.titleTransparent,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[styles.subtitle, isTransparent && styles.subtitleTransparent]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.rightContainer}>
          {rightAction}
        </View>
      </View>
    </>
  );

  if (isGradient) {
    return (
      <LinearGradient
        colors={gradients.brandSoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[...containerStyles, { paddingTop }]}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[...containerStyles, { paddingTop }]}>
      {content}
    </View>
  );
};

const HEADER_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  elevated: {
    ...shadows.sm,
  },
  transparent: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.base,
  },
  leftContainer: {
    width: 56,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 56,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleLarge: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleTransparent: {
    color: colors.neutral[0],
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  subtitleTransparent: {
    color: colors.neutral[200],
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
});
