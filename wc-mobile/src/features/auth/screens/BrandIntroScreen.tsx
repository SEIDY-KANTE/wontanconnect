/**
 * Brand Intro Screen
 * 
 * First launch branded intro screen that appears once before auth.
 * Duration: ~1.5-2 seconds with smooth animations.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackScreenProps } from '@/core/navigation/types';
import { useAppStore } from '@/core/store/appStore';
import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { gradients } from '@/design/tokens/gradients';
import { duration, easing } from '@/design/tokens/animation';
import logo from '@/assets/logo.png';

const INTRO_DURATION_MS = 1800;
const LOGO_FADE_DURATION = 600;
const TEXT_DELAY_MS = 300;
const TEXT_FADE_DURATION = 500;
const EXIT_DURATION = 400;

export const BrandIntroScreen: React.FC = () => {
  const navigation = useNavigation<RootStackScreenProps<'BrandIntro'>['navigation']>();
  const { markIntroAsSeen } = useAppStore();
  const insets = useSafeAreaInsets();

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.95);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Start entrance animations
    logoOpacity.value = withTiming(1, {
      duration: LOGO_FADE_DURATION,
      easing: easing.decelerate,
    });
    logoScale.value = withTiming(1, {
      duration: LOGO_FADE_DURATION,
      easing: easing.decelerate,
    });

    textOpacity.value = withDelay(
      TEXT_DELAY_MS,
      withTiming(1, {
        duration: TEXT_FADE_DURATION,
        easing: easing.decelerate,
      })
    );

    // Exit animation and navigation
    const exitTimer = setTimeout(() => {
      containerOpacity.value = withTiming(0, {
        duration: EXIT_DURATION,
        easing: easing.accelerate,
      }, () => {
        runOnJS(navigateToNext)();
      });
    }, INTRO_DURATION_MS);

    return () => clearTimeout(exitTimer);
  }, []);

  const navigateToNext = () => {
    markIntroAsSeen();
    // Always navigate to Onboarding after intro (Onboarding will handle next step)
    navigation.replace('Onboarding');
  };

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <LinearGradient
        colors={gradients.brandSoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.appName}>WontanConnect</Text>
          <Text style={styles.slogan}>Connecting people worldwide</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    ...typography.display,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  slogan: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
