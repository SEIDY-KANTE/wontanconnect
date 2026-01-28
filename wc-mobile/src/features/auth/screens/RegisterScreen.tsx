/**
 * Register Screen
 *
 * Handles user registration with real backend API.
 * Creates a new account with email and password.
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
  confirmPassword?: string;
}

const SUBMIT_DELAY_MS = 500;

export const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthScreenProps<"Register">["navigation"]>();
  const { completeAuth, showToast } = useAppStore();
  const {
    register,
    loadingState,
    error: authError,
    clearError,
  } = useAuthStore();

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Derive loading state from auth store
  const isSubmitting = loadingState === "registering";

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const input1Opacity = useSharedValue(0);
  const input2Opacity = useSharedValue(0);
  const input3Opacity = useSharedValue(0);
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
    input3Opacity.value = withDelay(
      200,
      withTiming(1, {
        duration: duration.fast,
        easing: easing.decelerate,
      }),
    );

    // Footer animation
    footerOpacity.value = withDelay(
      250,
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

  const handleConfirmChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
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

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = t("auth.errors.confirmRequired");
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t("auth.errors.passwordMismatch");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Extract display name from email (before @) as default
    const displayName = contact.split("@")[0] || "User";

    const success = await register(contact, password, displayName);

    if (success) {
      await completeAuth();
      showToast("success", t("auth.success.register"));
      navigation.getParent()?.reset({ index: 0, routes: [{ name: "Main" }] });
    } else if (authError) {
      // Show error toast for auth failures
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

  const input3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: input3Opacity.value,
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
            title={t("auth.register.title")}
            subtitle={t("auth.register.subtitle")}
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
                textContentType="newPassword"
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

            <AnimatedView style={[input3AnimatedStyle, styles.inputWrapper]}>
              <Input
                label={t("auth.fields.confirmPassword")}
                value={confirmPassword}
                onChangeText={handleConfirmChange}
                placeholder={t("auth.placeholders.confirmPassword")}
                secureTextEntry={!showConfirmPassword}
                textContentType="newPassword"
                error={errors.confirmPassword}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={18}
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>
                }
              />
            </AnimatedView>

            {t("auth.register.trustText") && (
              <AnimatedView
                style={[styles.trustTextContainer, input3AnimatedStyle]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={colors.success.main}
                />
                <Text style={styles.trustText}>
                  {t("auth.register.trustText")}
                </Text>
              </AnimatedView>
            )}

            <Button
              label={t("auth.register.submit")}
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            />
          </AnimatedCard>

          <AnimatedView style={[styles.footerRow, footerAnimatedStyle]}>
            <Text style={styles.footerText}>
              {t("auth.register.haveAccount")}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>{t("auth.register.login")}</Text>
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
    paddingBottom: spacing["4xl"],
  },
  formCard: {
    marginTop: -spacing.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
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
  inputWrapper: {
    marginTop: spacing.base,
  },
  trustTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  trustText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
});
