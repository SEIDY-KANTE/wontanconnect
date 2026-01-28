/**
 * Guest Restriction Modal
 *
 * Shows when a guest user tries to access a feature that requires registration.
 * Provides options to register, login, or dismiss.
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

interface GuestRestrictionModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string; // Optional: specific feature name for context
}

export const GuestRestrictionModal: React.FC<GuestRestrictionModalProps> = ({
  visible,
  onClose,
  feature,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const handleRegister = () => {
    onClose();
    // Navigate to Register screen
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth", params: { screen: "Register" } }],
    });
  };

  const handleLogin = () => {
    onClose();
    // Navigate to Login screen
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth", params: { screen: "Login" } }],
    });
  };

  return (
    <Modal visible={visible} onClose={onClose} dismissOnBackdrop={true}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color={colors.primary[500]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t("guest.restriction.title")}</Text>

        {/* Message */}
        <Text style={styles.message}>
          {feature
            ? t("guest.restriction.messageWithFeature", { feature })
            : t("guest.restriction.message")}
        </Text>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>
            {t("guest.restriction.benefitsTitle")}
          </Text>
          {["createOffers", "startExchanges", "sendMessages", "buildTrust"].map(
            (benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success.main}
                />
                <Text style={styles.benefitText}>
                  {t(`guest.restriction.benefits.${benefit}`)}
                </Text>
              </View>
            ),
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={t("guest.restriction.register")}
            onPress={handleRegister}
            variant="primary"
            style={styles.primaryButton}
          />
          <Button
            label={t("guest.restriction.login")}
            onPress={handleLogin}
            variant="outline"
            style={styles.secondaryButton}
          />
          <Button
            label={t("guest.restriction.later")}
            onPress={onClose}
            variant="ghost"
            style={styles.ghostButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headingMedium,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  benefitsContainer: {
    width: "100%",
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  benefitsTitle: {
    ...typography.labelMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  benefitText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
  },
  primaryButton: {
    width: "100%",
  },
  secondaryButton: {
    width: "100%",
  },
  ghostButton: {
    width: "100%",
  },
});
