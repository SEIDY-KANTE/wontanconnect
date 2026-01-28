/**
 * Take Offer Modal
 *
 * Modal for taking an FX offer with full or custom amount.
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { BottomSheet, Button, Card, Avatar } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { FXOffer } from "@/features/fx/model/types";
import { FXAgreedAmount } from "@/features/exchange/model/types";

interface TakeOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer: FXOffer;
  onSubmit: (agreedAmount: FXAgreedAmount) => void;
  isSubmitting?: boolean;
}

type AmountOption = "full" | "custom";

export const TakeOfferModal: React.FC<TakeOfferModalProps> = ({
  visible,
  onClose,
  offer,
  onSubmit,
  isSubmitting: externalSubmitting = false,
}) => {
  const { t } = useTranslation();

  const [selectedOption, setSelectedOption] = useState<AmountOption>("full");
  const [customFromAmount, setCustomFromAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate rate - only available if offer has rate or both amounts
  const rate = useMemo(() => {
    if (offer.rate) return offer.rate;
    if (offer.amountTo && offer.amountFrom) {
      return offer.amountTo / offer.amountFrom;
    }
    return undefined;
  }, [offer]);

  // Calculate custom to amount based on input
  const customToAmount = useMemo(() => {
    const fromNum = parseFloat(customFromAmount);
    if (isNaN(fromNum) || fromNum <= 0 || !rate) return 0;
    return fromNum * rate;
  }, [customFromAmount, rate]);

  // Final amounts based on selection
  const finalAmounts = useMemo((): FXAgreedAmount => {
    if (selectedOption === "full") {
      return {
        fromAmount: offer.amountFrom,
        toAmount:
          offer.amountTo || (rate ? offer.amountFrom * rate : undefined),
        fromCurrency: offer.fromCurrency,
        toCurrency: offer.toCurrency,
        rate,
        isFullAmount: true,
      };
    }

    const fromNum = parseFloat(customFromAmount) || 0;
    return {
      fromAmount: fromNum,
      toAmount: rate ? customToAmount : undefined,
      fromCurrency: offer.fromCurrency,
      toCurrency: offer.toCurrency,
      rate,
      isFullAmount: false,
    };
  }, [selectedOption, offer, rate, customFromAmount, customToAmount]);

  // Validation
  const isValid = useMemo(() => {
    if (selectedOption === "full") return true;
    const fromNum = parseFloat(customFromAmount);
    return fromNum > 0 && fromNum <= offer.amountFrom;
  }, [selectedOption, customFromAmount, offer.amountFrom]);

  // Validation error
  const validationError = useMemo(() => {
    if (selectedOption === "full") return null;
    const fromNum = parseFloat(customFromAmount);
    if (!customFromAmount) return null;
    if (isNaN(fromNum) || fromNum <= 0) {
      return t("exchange.takeOffer.errors.invalidAmount");
    }
    if (fromNum > offer.amountFrom) {
      return t("exchange.takeOffer.errors.exceedsMax");
    }
    return null;
  }, [selectedOption, customFromAmount, offer.amountFrom, t]);

  const formatAmount = (amount: number, currency: string) => {
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 2,
      }).format(amount) +
      " " +
      currency
    );
  };

  // Combined submitting state (local or external)
  const isSubmittingCombined = isSubmitting || externalSubmitting;

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmittingCombined) return;

    setIsSubmitting(true);
    onSubmit(finalAmounts);
    // Don't set submitting to false here - let external state control it
    // Don't close here - let the parent handle closing after success
  }, [isValid, isSubmittingCombined, finalAmounts, onSubmit]);

  const handleClose = () => {
    if (isSubmittingCombined) return; // Prevent closing during submission
    onClose();
    setSelectedOption("full");
    setCustomFromAmount("");
    setIsSubmitting(false);
  };

  // Reset local state when modal closes
  React.useEffect(() => {
    if (!visible) {
      setSelectedOption("full");
      setCustomFromAmount("");
      setIsSubmitting(false);
    }
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={t("exchange.takeOffer.title")}
      subtitle={t("exchange.takeOffer.subtitle")}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Offer Summary */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card style={styles.summaryCard}>
            <View style={styles.userRow}>
              <Avatar
                source={offer.user.avatar}
                name={offer.user.name}
                size="md"
                verified={offer.user.isVerified}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{offer.user.name}</Text>
                {offer.user.rating !== undefined && offer.user.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons
                      name="star"
                      size={12}
                      color={colors.secondary[500]}
                    />
                    <Text style={styles.ratingText}>
                      {offer.user.rating} ({offer.user.totalDeals}{" "}
                      {t("profile.stats.deals").toLowerCase()})
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.exchangeInfo}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>{t("fx.from")}</Text>
                <Text style={styles.amountValue}>
                  {formatAmount(offer.amountFrom, offer.fromCurrency)}
                </Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.text.tertiary}
              />
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>{t("fx.to")}</Text>
                <Text style={styles.amountValue}>
                  {offer.amountTo
                    ? formatAmount(offer.amountTo, offer.toCurrency)
                    : rate !== undefined
                      ? formatAmount(offer.amountFrom * rate, offer.toCurrency)
                      : t("common.negotiable", "To be agreed")}
                </Text>
              </View>
            </View>

            {rate !== undefined && (
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>{t("fx.rate")}</Text>
                <Text style={styles.rateValue}>
                  1 {offer.fromCurrency} = {rate.toLocaleString("fr-FR")}{" "}
                  {offer.toCurrency}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Amount Selection */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>
            {t("exchange.takeOffer.selectAmount")}
          </Text>

          {/* Full Amount Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === "full" && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedOption("full")}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              <View
                style={[
                  styles.radioOuter,
                  selectedOption === "full" && styles.radioOuterSelected,
                ]}
              >
                {selectedOption === "full" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                {t("exchange.takeOffer.fullAmount")}
              </Text>
              <Text style={styles.optionSubtitle}>
                {formatAmount(offer.amountFrom, offer.fromCurrency)} →{" "}
                {formatAmount(
                  offer.amountTo || offer.amountFrom * rate,
                  offer.toCurrency,
                )}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Custom Amount Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === "custom" && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedOption("custom")}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              <View
                style={[
                  styles.radioOuter,
                  selectedOption === "custom" && styles.radioOuterSelected,
                ]}
              >
                {selectedOption === "custom" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                {t("exchange.takeOffer.customAmount")}
              </Text>
              <Text style={styles.optionSubtitle}>
                {t("exchange.takeOffer.customAmountHint", {
                  max: formatAmount(offer.amountFrom, offer.fromCurrency),
                })}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Custom Amount Input */}
          {selectedOption === "custom" && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.customInputContainer}
            >
              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>
                    {t("exchange.takeOffer.youSend")}
                  </Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      value={customFromAmount}
                      onChangeText={setCustomFromAmount}
                      placeholder="0"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Text style={styles.inputCurrency}>
                      {offer.fromCurrency}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.text.tertiary}
                  style={styles.inputArrow}
                />

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>
                    {t("exchange.takeOffer.youReceive")}
                  </Text>
                  <View style={[styles.inputBox, styles.inputBoxDisabled]}>
                    <Text style={styles.inputCalculated}>
                      {rate !== undefined && customToAmount > 0
                        ? new Intl.NumberFormat("fr-FR", {
                            maximumFractionDigits: 0,
                          }).format(customToAmount)
                        : rate !== undefined
                          ? "0"
                          : "—"}
                    </Text>
                    <Text style={styles.inputCurrency}>{offer.toCurrency}</Text>
                  </View>
                </View>
              </View>

              {validationError && (
                <Text style={styles.errorText}>{validationError}</Text>
              )}
            </Animated.View>
          )}
        </Animated.View>

        {/* Summary */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.finalSummary}>
            <Text style={styles.summaryTitle}>
              {t("exchange.takeOffer.summary")}
            </Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t("exchange.takeOffer.youSend")}
              </Text>
              <Text style={styles.summaryValue}>
                {formatAmount(
                  finalAmounts.fromAmount,
                  finalAmounts.fromCurrency,
                )}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t("exchange.takeOffer.youReceive")}
              </Text>
              <Text style={[styles.summaryValue, styles.summaryValueHighlight]}>
                {finalAmounts.toAmount !== undefined
                  ? formatAmount(finalAmounts.toAmount, finalAmounts.toCurrency)
                  : t("common.negotiable", "To be agreed")}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("fx.rate")}</Text>
              <Text style={styles.summaryValue}>
                {rate !== undefined
                  ? `1 ${finalAmounts.fromCurrency} = ${rate.toLocaleString("fr-FR")} ${finalAmounts.toCurrency}`
                  : t("common.negotiable", "To be agreed")}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.info.dark}
          />
          <Text style={styles.infoBannerText}>
            {t("exchange.takeOffer.info")}
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          label={t("exchange.takeOffer.submit")}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmittingCombined}
          disabled={!isValid || isSubmittingCombined}
          style={styles.submitButton}
        />
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: spacing.base,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xxs,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xxs,
  },
  exchangeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.light,
  },
  amountBox: {
    flex: 1,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.xxs,
  },
  amountValue: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  rateLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  rateValue: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  optionRadio: {
    marginRight: spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.primary[600],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  optionSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  customInputContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inputBoxDisabled: {
    backgroundColor: colors.background.tertiary,
  },
  input: {
    flex: 1,
    ...typography.labelLarge,
    color: colors.text.primary,
    padding: 0,
  },
  inputCalculated: {
    flex: 1,
    ...typography.labelLarge,
    color: colors.text.secondary,
  },
  inputCurrency: {
    ...typography.labelMedium,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  inputArrow: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error.main,
    marginTop: spacing.sm,
  },
  finalSummary: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.labelMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  summaryValueHighlight: {
    color: colors.success.dark,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: colors.info.light,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  infoBannerText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  submitButton: {
    marginBottom: spacing.md,
  },
});
