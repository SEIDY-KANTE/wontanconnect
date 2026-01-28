/**
 * Auth Hero Header
 */

import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { shadows } from '@/design/tokens/shadows';
import { gradients } from '@/design/tokens/gradients';
import logo from '@/assets/logo.png';

const HERO_MIN_HEIGHT = 230;
const LOGO_CONTAINER_SIZE = 72;
const LOGO_SIZE = 44;
const SHAPE_LG = 200;
const SHAPE_MD = 140;

interface AuthHeroProps {
  title: string;
  subtitle: string;
}

export const AuthHero: React.FC<AuthHeroProps> = ({ title, subtitle }) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.brandSoft}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
    >
      <View style={styles.shapeLarge} />
      <View style={styles.shapeMedium} />

      <View style={styles.logoContainer}>
        <Image source={logo} style={styles.logo} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: HERO_MIN_HEIGHT,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
    overflow: 'hidden',
  },
  logoContainer: {
    width: LOGO_CONTAINER_SIZE,
    height: LOGO_CONTAINER_SIZE,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    resizeMode: 'contain',
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 280,
  },
  shapeLarge: {
    position: 'absolute',
    top: -SHAPE_MD,
    right: -SHAPE_MD,
    width: SHAPE_LG,
    height: SHAPE_LG,
    borderRadius: SHAPE_LG / 2,
    backgroundColor: colors.primary[100],
    opacity: 0.4,
  },
  shapeMedium: {
    position: 'absolute',
    bottom: -SHAPE_MD,
    left: -SHAPE_MD,
    width: SHAPE_MD,
    height: SHAPE_MD,
    borderRadius: SHAPE_MD / 2,
    backgroundColor: colors.primary[50],
    opacity: 0.6,
  },
});
