/**
 * Login Screen
 *
 * Handles user authentication with real backend API.
 * Supports email/password login and guest mode.
 */

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { AuthScreenProps } from "@/core/navigation/types";
import { useAppStore } from "@/core/store/appStore";
import { useAuthStore } from "@/core/store/authStore";
import { Button, Input, Card } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { duration, easing } from "@/design/tokens/animation";
import {
  isValidContact,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
} from "../utils/validation";
import { AuthHero } from "../components/AuthHero";

const AnimatedCard = Animated.createAnimatedComponent(Card);
const AnimatedView = Animated.createAnimatedComponent(View);

interface FieldErrors {
  contact?: string;
  password?: string;
}

const SUBMIT_DELAY_MS = 400;

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthScreenProps<"Login">["navigation"]>();
  const { completeAuth, showToast } = useAppStore();
  const {
    login,
    loginAsGuest,
    loadingState,
    error: authError,
    clearError,
  } = useAuthStore();

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Derive loading state from auth store
  const isSubmitting = loadingState === "logging_in";

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const input1Opacity = useSharedValue(0);
  const input2Opacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

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

    // Staggered input animations
    input1Opacity.value = withDelay(
      100,
      withTiming(1, {
        duration: duration.fast,
        easing: easing.decelerate,
      }),
    );
    input2Opacity.value = withDelay(
      150,
      withTiming(1, {
        duration: duration.fast,
        easing: easing.decelerate,
      }),
    );

    // Footer animation
    footerOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: duration.fast,
        easing: easing.decelerate,
      }),
    );
  }, []);

  const handleContactChange = (value: string) => {
    setContact(value);
    if (errors.contact) {
      setErrors((prev) => ({ ...prev, contact: undefined }));
    }
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};
    if (!contact.trim()) {
      nextErrors.contact = t("auth.errors.contactRequired");
    } else if (!isValidContact(contact)) {
      nextErrors.contact = t("auth.errors.contactInvalid");
    }

    if (!password.trim()) {
      nextErrors.password = t("auth.errors.passwordRequired");
    } else if (!isValidPassword(password)) {
      nextErrors.password = t("auth.errors.passwordMin", {
        count: MIN_PASSWORD_LENGTH,
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToMain = async (toastMessage: string) => {
    await completeAuth();
    showToast("success", toastMessage);
    navigation.getParent()?.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const success = await login(contact, password);

    if (success) {
      await goToMain(t("auth.success.login"));
    } else if (authError) {
      // Show error toast for auth failures
      showToast("error", authError.message);
    }
  };

  const handleGuest = async () => {
    const success = await loginAsGuest();

    if (success) {
      await goToMain(t("auth.success.guest"));
    } else if (authError) {
      showToast("error", authError.message);
    }
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const input1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: input1Opacity.value,
  }));

  const input2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: input2Opacity.value,
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHero
            title={t("auth.login.title")}
            subtitle={t("auth.login.subtitle")}
          />

          <AnimatedCard
            style={[styles.formCard, cardAnimatedStyle]}
            variant="elevated"
            padding="lg"
          >
            <AnimatedView style={input1AnimatedStyle}>
              <Input
                label={t("auth.fields.contact")}
                value={contact}
                onChangeText={handleContactChange}
                placeholder={t("auth.placeholders.contact")}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                error={errors.contact}
              />
            </AnimatedView>

            <AnimatedView style={[input2AnimatedStyle, styles.inputWrapper]}>
              <Input
                label={t("auth.fields.password")}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder={t("auth.placeholders.password")}
                secureTextEntry={!showPassword}
                textContentType="password"
                error={errors.password}
                helperText={t("auth.helpers.passwordMin", {
                  count: MIN_PASSWORD_LENGTH,
                })}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>
                }
              />
            </AnimatedView>

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.forgotLink}
            >
              <Text style={styles.linkText}>{t("auth.login.forgot")}</Text>
            </TouchableOpacity>

            <Button
              label={t("auth.login.submit")}
              onPress={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            />
          </AnimatedCard>

          <AnimatedView style={[styles.footerRow, footerAnimatedStyle]}>
            <Text style={styles.footerText}>{t("auth.login.noAccount")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>
                {t("auth.login.createAccount")}
              </Text>
            </TouchableOpacity>
          </AnimatedView>

          <Button
            label={t("auth.login.guest")}
            onPress={handleGuest}
            variant="ghost"
            size="md"
            fullWidth
            style={styles.guestButton}
          />
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
    paddingBottom: spacing["4xl"],
  },
  formCard: {
    marginTop: -spacing.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: spacing.base,
  },
  linkText: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginHorizontal: spacing.base,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  footerLink: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
  guestButton: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inputWrapper: {
    marginTop: spacing.base,
  },
});
