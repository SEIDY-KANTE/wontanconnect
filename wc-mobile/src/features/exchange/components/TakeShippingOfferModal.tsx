/**
 * Take Shipping Offer Modal
 * Modal for users to request a shipping offer with description
 */

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

import { BottomSheet, Button } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { ShippingOffer } from "@/features/shipping/model/types";

interface TakeShippingOfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; weight?: string }) => void;
  offer: ShippingOffer;
}

export const TakeShippingOfferModal: React.FC<TakeShippingOfferModalProps> = ({
  visible,
  onClose,
  onSubmit,
  offer,
}) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!description.trim()) return;

    setIsSubmitting(true);
    onSubmit({
      description: description.trim(),
      weight: weight.trim() || undefined,
    });

    // Reset form
    setDescription("");
    setWeight("");
    setIsSubmitting(false);
    onClose();
  }, [description, weight, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    setDescription("");
    setWeight("");
    onClose();
  }, [onClose]);

  const isValid = description.trim().length > 0;

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={t("exchange.takeOffer.shippingTitle")}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Offer Summary */}
          <Animated.View
            entering={FadeInUp.delay(100)}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={colors.primary[600]}
              />
              <Text style={styles.summaryTitle}>
                {t("exchange.takeOffer.offerDetails")}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("shipping.from")}</Text>
              <Text style={styles.summaryValue}>{offer.fromCity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("shipping.to")}</Text>
              <Text style={styles.summaryValue}>{offer.toCity}</Text>
            </View>
            {offer.capacity && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t("shipping.capacity")}
                </Text>
                <Text style={styles.summaryValue}>{offer.capacity}</Text>
              </View>
            )}
            {offer.price && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("shipping.price")}</Text>
                <Text style={styles.summaryValue}>{offer.price}</Text>
              </View>
            )}
          </Animated.View>

          {/* Description Input */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={styles.inputLabel}>
              {t("exchange.takeOffer.descriptionLabel")}
            </Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder={t("exchange.takeOffer.descriptionPlaceholder")}
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Weight Input (Optional) */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <Text style={styles.inputLabel}>
              {t("exchange.takeOffer.weightLabel")}
            </Text>
            <TextInput
              style={styles.textInput}
              value={weight}
              onChangeText={setWeight}
              placeholder={t("exchange.takeOffer.weightPlaceholder")}
              placeholderTextColor={colors.text.tertiary}
            />
          </Animated.View>

          {/* Submit Button */}
          <Animated.View
            entering={FadeInUp.delay(400)}
            style={styles.submitContainer}
          >
            <Button
              label={t("exchange.takeOffer.submit")}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              icon={
                <Ionicons
                  name="send-outline"
                  size={18}
                  color={colors.neutral[0]}
                />
              }
            />
          </Animated.View>

          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.labelMedium,
    color: colors.primary[700],
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  inputLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    padding: spacing.base,
    minHeight: 100,
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    padding: spacing.base,
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  submitContainer: {
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
