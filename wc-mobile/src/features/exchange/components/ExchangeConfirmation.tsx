/**
 * Exchange Confirmation Button
 *
 * Button component for confirming exchange completion.
 */

import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { Modal } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

interface ExchangeConfirmationButtonProps {
  label: string;
  isConfirmed: boolean;
  _isPartnerConfirmed?: boolean; // Keeping for future use with underscore prefix
  onConfirm: () => void;
  disabled?: boolean;
}

export const ExchangeConfirmationButton: React.FC<
  ExchangeConfirmationButtonProps
> = ({
  label,
  isConfirmed,
  _isPartnerConfirmed,
  onConfirm,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePress = () => {
    if (!isConfirmed && !disabled) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    setShowConfirmModal(false);
  };

  if (isConfirmed) {
    return (
      <Animated.View entering={FadeIn} style={styles.confirmedContainer}>
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={colors.success.main}
        />
        <Text style={styles.confirmedText}>
          {t("exchange.confirm.youConfirmed")}
        </Text>
      </Animated.View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={22}
          color={disabled ? colors.text.tertiary : colors.primary[600]}
        />
        <Text
          style={[styles.buttonText, disabled && styles.buttonTextDisabled]}
        >
          {t(label)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t("exchange.confirm.title")}
        message={t("exchange.confirm.confirmQuestion")}
        primaryAction={{
          label: t("common.confirm"),
          onPress: handleConfirm,
        }}
        secondaryAction={{
          label: t("common.cancel"),
          onPress: () => setShowConfirmModal(false),
        }}
      >
        <View style={styles.modalWarning}>
          <Ionicons name="warning" size={20} color={colors.warning.dark} />
          <Text style={styles.warningText}>
            {t("exchange.confirm.warning")}
          </Text>
        </View>
      </Modal>
    </>
  );
};

/**
 * Exchange Confirmation Status
 *
 * Shows the confirmation status of both parties.
 */
interface ExchangeConfirmationStatusProps {
  initiatorName: string;
  takerName: string;
  initiatorConfirmed: boolean;
  takerConfirmed: boolean;
  isCurrentUserInitiator: boolean;
}

export const ExchangeConfirmationStatus: React.FC<
  ExchangeConfirmationStatusProps
> = ({
  initiatorName,
  takerName,
  initiatorConfirmed,
  takerConfirmed,
  isCurrentUserInitiator,
}) => {
  const { t } = useTranslation();

  const bothConfirmed = initiatorConfirmed && takerConfirmed;

  if (bothConfirmed) {
    return (
      <View style={styles.completedBanner}>
        <Ionicons
          name="checkmark-done-circle"
          size={24}
          color={colors.success.dark}
        />
        <Text style={styles.completedText}>
          {t("exchange.confirm.bothConfirmed")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Ionicons
            name={initiatorConfirmed ? "checkmark-circle" : "time-outline"}
            size={20}
            color={
              initiatorConfirmed ? colors.success.main : colors.text.tertiary
            }
          />
          <Text style={styles.statusName}>
            {isCurrentUserInitiator
              ? t("common.you")
              : initiatorName.split(" ")[0]}
          </Text>
          <Text
            style={[
              styles.statusLabel,
              initiatorConfirmed && styles.statusLabelConfirmed,
            ]}
          >
            {initiatorConfirmed
              ? t("exchange.confirm.youConfirmed")
              : t("exchange.confirm.waitingPartner")}
          </Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusItem}>
          <Ionicons
            name={takerConfirmed ? "checkmark-circle" : "time-outline"}
            size={20}
            color={takerConfirmed ? colors.success.main : colors.text.tertiary}
          />
          <Text style={styles.statusName}>
            {!isCurrentUserInitiator
              ? t("common.you")
              : takerName.split(" ")[0]}
          </Text>
          <Text
            style={[
              styles.statusLabel,
              takerConfirmed && styles.statusLabelConfirmed,
            ]}
          >
            {takerConfirmed
              ? t("exchange.confirm.partnerConfirmed")
              : t("exchange.confirm.waitingPartner")}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary[200],
    gap: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  buttonText: {
    ...typography.labelLarge,
    color: colors.primary[600],
  },
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
  confirmedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success.light,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  confirmedText: {
    ...typography.labelLarge,
    color: colors.success.dark,
  },
  modalWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning.light,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.warning.dark,
    marginLeft: spacing.sm,
    flex: 1,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success.light,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  completedText: {
    ...typography.labelLarge,
    color: colors.success.dark,
  },
  statusContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
  },
  statusName: {
    ...typography.labelMedium,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statusLabel: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
    textAlign: "center",
  },
  statusLabelConfirmed: {
    color: colors.success.main,
  },
  statusDivider: {
    width: StyleSheet.hairlineWidth,
    height: "80%",
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
});
