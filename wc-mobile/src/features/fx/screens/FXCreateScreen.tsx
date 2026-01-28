/**
 * FX Create Screen
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { FXScreenProps } from "@/core/navigation/types";
import { useFXStore } from "../store/fxStore";
import { useAppStore } from "@/core/store/appStore";
import { FXOfferType, Currency } from "../model/types";
import { currencyInfo } from "../data/mockData";
import { useFxCalculation } from "../hooks/useFxCalculation";
import { Button, Input, SelectField } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { gradients } from "@/design/tokens/gradients";
import { shadows } from "@/design/tokens/shadows";
import { countries, citiesByCountry, CountryCode } from "@/data/locations";

const currencies: Currency[] = ["GNF", "EUR", "USD", "TRY", "XOF"];
const defaultCountry: CountryCode = "TR";

export const FXCreateScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<FXScreenProps<"FXCreate">["navigation"]>();
  const insets = useSafeAreaInsets();
  const { offers, addOffer, updateOffer, getOfferById, loadOffers } =
    useFXStore();
  const { showToast } = useAppStore();
  const route = useRoute<FXScreenProps<"FXCreate">["route"]>();
  const offerId = route.params?.offerId;
  const isEditing = Boolean(offerId);

  const [type, setType] = useState<FXOfferType>("selling");
  const [fromCurrency, setFromCurrency] = useState<Currency>("EUR");
  const [toCurrency, setToCurrency] = useState<Currency>("GNF");
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [city, setCity] = useState(
    citiesByCountry[defaultCountry][0]?.name ?? "",
  );
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [pendingValues, setPendingValues] = useState<{
    amountFrom: number;
    amountTo: number | null;
    rate: number | null;
  } | null>(null);
  const {
    amountFrom,
    amountTo,
    rate,
    onChangeAmountFrom,
    onChangeAmountTo,
    onChangeRate,
    setValues,
    numericValues,
    autoCalculatedField,
    ratePreview,
  } = useFxCalculation({ fromCurrency, toCurrency });

  const offer = offerId ? getOfferById(offerId) : undefined;

  const isAmountFromValid = Boolean(
    numericValues.amountFrom && numericValues.amountFrom > 0,
  );
  const isLocationValid = Boolean(country && city);

  const countryOptions = useMemo(
    () =>
      countries.map((option) => ({
        value: option.code,
        label: t(option.nameKey),
        leftIcon: <Text style={styles.flag}>{option.flag}</Text>,
      })),
    [t],
  );

  const cityOptions = useMemo(
    () =>
      (citiesByCountry[country] || []).map((option) => ({
        value: option.name,
        label: option.name,
      })),
    [country],
  );

  useEffect(() => {
    const availableCities = citiesByCountry[country] || [];
    if (!availableCities.length) {
      setCity("");
      return;
    }
    if (!availableCities.some((option) => option.name === city)) {
      setCity(availableCities[0].name);
    }
  }, [city, country]);

  useEffect(() => {
    if (!offerId) return;
    if (offers.length === 0) {
      loadOffers();
    }
  }, [loadOffers, offerId, offers.length]);

  useEffect(() => {
    if (!offerId || !offer || hasInitialized) return;

    setType(offer.type);
    setFromCurrency(offer.fromCurrency);
    setToCurrency(offer.toCurrency);
    const nextCountry =
      countries.find((option) => option.code === offer.location.country)
        ?.code ?? defaultCountry;
    setCountry(nextCountry);
    setCity(offer.location.city);
    setDescription(offer.description ?? "");
    setPendingValues({
      amountFrom: offer.amountFrom,
      amountTo: offer.amountTo ?? null,
      rate: offer.rate ?? null,
    });
    setHasInitialized(true);
  }, [hasInitialized, offer, offerId]);

  useEffect(() => {
    if (!pendingValues) return;
    setValues({
      amountFrom: pendingValues.amountFrom,
      amountTo: pendingValues.amountTo,
      rate: pendingValues.rate,
    });
    setPendingValues(null);
  }, [pendingValues, setValues]);

  const handleCountrySelect = (value: string) => {
    const nextCountry = countries.find((option) => option.code === value)?.code;
    if (nextCountry) {
      setCountry(nextCountry);
    }
  };

  const handleSubmit = async () => {
    if (!isAmountFromValid) return;

    setIsSubmitting(true);

    const amountFromValue = numericValues.amountFrom ?? 0;
    const amountToValue = numericValues.amountTo ?? 0;
    const rateValue = numericValues.rate ?? 0;

    try {
      if (isEditing && offerId) {
        const success = await updateOffer(offerId, {
          type,
          fromCurrency,
          toCurrency,
          amountFrom: amountFromValue,
          amountTo: amountToValue > 0 ? amountToValue : undefined,
          rate: rateValue > 0 ? rateValue : undefined,
          description: description || undefined,
          location: { country, city },
        });

        if (success) {
          showToast("success", t("fx.form.updateSuccess"));
          navigation.goBack();
        } else {
          showToast(
            "error",
            t(
              "fx.form.updateError",
              "Failed to update offer. Please try again.",
            ),
          );
        }
      } else {
        const newOffer = await addOffer({
          type,
          fromCurrency,
          toCurrency,
          amountFrom: amountFromValue,
          amountTo: amountToValue > 0 ? amountToValue : undefined,
          rate: rateValue > 0 ? rateValue : undefined,
          description: description || undefined,
          location: { country, city },
        });

        if (newOffer) {
          showToast("success", t("fx.form.success"));
          navigation.goBack();
        } else {
          showToast(
            "error",
            t("fx.form.error", "Failed to create offer. Please try again."),
          );
        }
      }
    } catch (error) {
      showToast(
        "error",
        t("fx.form.error", "Something went wrong. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrencySelector = (
    label: string,
    value: Currency,
    onChange: (c: Currency) => void,
  ) => (
    <View style={styles.currencySelectorContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.currencyList}
      >
        {currencies.map((currency) => {
          const info = currencyInfo[currency] || {
            flag: "💱",
            symbol: currency,
            name: currency,
          };
          const isSelected = value === currency;
          return (
            <TouchableOpacity
              key={currency}
              onPress={() => onChange(currency)}
              style={[
                styles.currencyOption,
                isSelected && styles.currencyOptionSelected,
              ]}
            >
              <Text style={styles.currencyFlag}>{info.flag}</Text>
              <Text
                style={[
                  styles.currencyCode,
                  isSelected && styles.currencyCodeSelected,
                ]}
              >
                {currency}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.brandSoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t("fx.form.editTitle") : t("fx.form.title")}
        </Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              onPress={() => setType("selling")}
              style={[
                styles.typeOption,
                type === "selling" && styles.typeOptionActive,
              ]}
            >
              <Ionicons
                name="arrow-up-circle"
                size={24}
                color={
                  type === "selling" ? colors.neutral[0] : colors.success.main
                }
              />
              <Text
                style={[
                  styles.typeLabel,
                  type === "selling" && styles.typeLabelActive,
                ]}
              >
                {t("fx.filters.selling")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType("buying")}
              style={[
                styles.typeOption,
                type === "buying" && styles.typeOptionActiveBuying,
              ]}
            >
              <Ionicons
                name="arrow-down-circle"
                size={24}
                color={
                  type === "buying" ? colors.neutral[0] : colors.primary[600]
                }
              />
              <Text
                style={[
                  styles.typeLabel,
                  type === "buying" && styles.typeLabelActive,
                ]}
              >
                {t("fx.filters.buying")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Currency Selectors */}
          {renderCurrencySelector(
            t("fx.form.fromCurrency"),
            fromCurrency,
            setFromCurrency,
          )}
          {renderCurrencySelector(
            t("fx.form.toCurrency"),
            toCurrency,
            setToCurrency,
          )}

          {/* Location */}
          <SelectField
            label={t("fx.form.country")}
            value={country}
            options={countryOptions}
            onSelect={handleCountrySelect}
            placeholder={t("common.selectCountry")}
            sheetTitle={t("fx.form.country")}
          />
          <SelectField
            label={t("fx.form.city")}
            value={city}
            options={cityOptions}
            onSelect={setCity}
            placeholder={t("common.selectCity")}
            helperText={
              !cityOptions.length ? t("common.selectCountryFirst") : undefined
            }
            disabled={!cityOptions.length}
            sheetTitle={t("fx.form.city")}
            emptyText={t("common.noResults")}
          />

          {/* Amount Fields */}
          <Input
            label={t("fx.form.amountFrom")}
            value={amountFrom}
            onChangeText={onChangeAmountFrom}
            placeholder="0"
            keyboardType="decimal-pad"
            helperText={
              autoCalculatedField === "amountFrom"
                ? t("fx.form.amountAuto")
                : undefined
            }
            rightIcon={
              <Text style={styles.currencyIndicator}>{fromCurrency}</Text>
            }
          />

          <Input
            label={t("fx.form.amountTo")}
            value={amountTo}
            onChangeText={onChangeAmountTo}
            placeholder={t("common.optional")}
            keyboardType="decimal-pad"
            helperText={
              autoCalculatedField === "amountTo"
                ? t("fx.form.amountAuto")
                : t("common.optional")
            }
            rightIcon={
              <Text style={styles.currencyIndicator}>{toCurrency}</Text>
            }
          />

          <Input
            label={t("fx.form.rate")}
            value={rate}
            onChangeText={onChangeRate}
            placeholder={t("fx.form.ratePlaceholder")}
            keyboardType="decimal-pad"
            helperText={
              autoCalculatedField === "rate"
                ? t("fx.form.rateAuto")
                : t("common.optional")
            }
            rightIcon={
              <Text style={styles.currencyIndicator}>{toCurrency}</Text>
            }
          />

          {ratePreview && (
            <Text style={styles.ratePreview}>
              {t("fx.form.ratePreview", {
                from: fromCurrency,
                rate: ratePreview,
                to: toCurrency,
              })}
            </Text>
          )}

          {/* Description */}
          <Input
            label={t("fx.form.description")}
            value={description}
            onChangeText={setDescription}
            placeholder={t("fx.form.descriptionPlaceholder")}
            multiline
            numberOfLines={3}
          />
        </ScrollView>

        {/* Submit Button */}
        <View
          style={[
            styles.submitContainer,
            { paddingBottom: insets.bottom || spacing.base },
          ]}
        >
          <Button
            label={isEditing ? t("common.save") : t("fx.form.publish")}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!isAmountFromValid || !isLocationValid}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerRight: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },
  typeSelector: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  typeOptionActive: {
    backgroundColor: colors.success.main,
    borderColor: colors.success.main,
  },
  typeOptionActiveBuying: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  typeLabel: {
    ...typography.labelLarge,
    color: colors.text.secondary,
  },
  typeLabelActive: {
    color: colors.neutral[0],
  },
  currencySelectorContainer: {
    marginBottom: spacing.base,
  },
  inputLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  currencyList: {
    gap: spacing.sm,
  },
  currencyOption: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    minWidth: 72,
  },
  currencyOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  currencyFlag: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  currencyCode: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  currencyCodeSelected: {
    color: colors.primary[600],
  },
  currencyIndicator: {
    ...typography.labelMedium,
    color: colors.text.tertiary,
  },
  submitContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  flag: {
    fontSize: 18,
  },
  ratePreview: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.base,
    marginLeft: spacing.xs,
  },
});
