/**
 * Forgot Password Screen
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import { AuthScreenProps } from '@/core/navigation/types';
import { useAppStore } from '@/core/store/appStore';
import { Button, Input, Card } from '@/components';
import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { duration, easing } from '@/design/tokens/animation';
import { isValidContact } from '../utils/validation';
import { AuthHero } from '../components/AuthHero';

const AnimatedCard = Animated.createAnimatedComponent(Card);
const AnimatedView = Animated.createAnimatedComponent(View);

interface FieldErrors {
  contact?: string;
}

const SUBMIT_DELAY_MS = 400;

export const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthScreenProps<'ForgotPassword'>['navigation']>();
  const { showToast } = useAppStore();

  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const inputOpacity = useSharedValue(0);
  const backLinkOpacity = useSharedValue(0);

  useEffect(() => {
    // Card entrance animation
    cardOpacity.value = withTiming(1, {
      duration: duration.normal,
      easing: easing.decelerate,
    });
    cardTranslateY.value = withTiming(0, {
      duration: duration.normal,
      easing: easing.decelerate,
    });

    // Input animation
    inputOpacity.value = withDelay(100, withTiming(1, {
      duration: duration.fast,
      easing: easing.decelerate,
    }));

    // Back link animation
    backLinkOpacity.value = withDelay(150, withTiming(1, {
      duration: duration.fast,
      easing: easing.decelerate,
    }));
  }, []);

  const handleContactChange = (value: string) => {
    setContact(value);
    if (errors.contact) {
      setErrors((prev) => ({ ...prev, contact: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};
    if (!contact.trim()) {
      nextErrors.contact = t('auth.errors.contactRequired');
    } else if (!isValidContact(contact)) {
      nextErrors.contact = t('auth.errors.contactInvalid');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, SUBMIT_DELAY_MS));
    showToast('success', t('auth.success.reset'));
    navigation.goBack();
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  const backLinkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backLinkOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHero title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} />

          <AnimatedCard style={[styles.formCard, cardAnimatedStyle]} variant="elevated" padding="lg">
            <AnimatedView style={inputAnimatedStyle}>
              <Input
                label={t('auth.fields.contact')}
                value={contact}
                onChangeText={handleContactChange}
                placeholder={t('auth.placeholders.contact')}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                error={errors.contact}
              />
            </AnimatedView>

            <Button
              label={t('auth.forgot.submit')}
              onPress={handleReset}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            />
          </AnimatedCard>

          <AnimatedView style={backLinkAnimatedStyle}>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={16} color={colors.primary[600]} />
              <Text style={styles.backText}>{t('auth.forgot.back')}</Text>
            </TouchableOpacity>
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  formCard: {
    marginTop: -spacing.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.base,
  },
  backText: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
});
