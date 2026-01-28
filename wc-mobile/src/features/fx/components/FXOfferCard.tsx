/**
 * FX Offer Card Component
 */

import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { FXOffer } from "../model/types";
import { currencyInfo } from "../data/mockData";
import { countryFlags } from "@/data/locations";
import { Card, Avatar, Tag } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { getStatusTagVariant } from "@/utils/status";

interface FXOfferCardProps {
  offer: FXOffer;
  onPress: () => void;
  showStatusBadge?: boolean;
  onActionPress?: () => void;
}

export const FXOfferCard: React.FC<FXOfferCardProps> = ({
  offer,
  onPress,
  showStatusBadge = false,
  onActionPress,
}) => {
  const { t } = useTranslation();

  // Safe currency lookup with fallback
  const fromCurrency = currencyInfo[offer.fromCurrency] || {
    symbol: offer.fromCurrency,
    name: offer.fromCurrency,
    flag: "💱",
  };
  const toCurrency = currencyInfo[offer.toCurrency] || {
    symbol: offer.toCurrency,
    name: offer.toCurrency,
    flag: "💱",
  };
  const countryFlag = countryFlags[offer.location.country] || "🌍";
  const statusVariant = getStatusTagVariant(offer.status);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " " + currency;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const handleActionPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onActionPress?.();
  };

  return (
    <Card onPress={onPress} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          source={offer.user.avatar}
          name={offer.user.name}
          size="md"
          verified={offer.user.isVerified}
        />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{offer.user.name}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.location}>
              {countryFlag} {offer.location.city}
            </Text>
            {offer.user.rating != null && offer.user.rating > 0 && (
              <View style={styles.rating}>
                <Ionicons name="star" size={12} color={colors.secondary[500]} />
                <Text style={styles.ratingText}>{offer.user.rating}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          {showStatusBadge && (
            <Tag
              label={t(`common.status.${offer.status}`)}
              variant={statusVariant}
              size="sm"
            />
          )}
          <Tag
            label={t(`fx.filters.${offer.type}`)}
            variant={offer.type === "selling" ? "success" : "primary"}
            size="sm"
          />
          {onActionPress && (
            <TouchableOpacity
              onPress={handleActionPress}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={t("common.edit")}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Exchange Info */}
      <View style={styles.exchangeContainer}>
        <View style={styles.currencyBlock}>
          <Text style={styles.currencyFlag}>{fromCurrency.flag}</Text>
          <Text style={styles.currencyAmount}>
            {formatAmount(offer.amountFrom, offer.fromCurrency)}
          </Text>
        </View>

        <Ionicons
          name="arrow-forward"
          size={20}
          color={colors.primary[500]}
          style={styles.arrow}
        />

        <View style={styles.currencyBlock}>
          <Text style={styles.currencyFlag}>{toCurrency.flag}</Text>
          <Text style={styles.currencyAmount}>
            {offer.amountTo
              ? formatAmount(offer.amountTo, offer.toCurrency)
              : offer.toCurrency}
          </Text>
        </View>
      </View>

      {/* Rate badge */}
      {offer.rate !== undefined && offer.rate !== null && (
        <View style={styles.rateContainer}>
          <Text style={styles.rateLabel}>{t("fx.rate")}:</Text>
          <Text style={styles.rateValue}>
            1 {offer.fromCurrency} = {offer.rate} {offer.toCurrency}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(offer.createdAt)}</Text>
        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>{t("common.seeAll")}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary[600]}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xxs,
  },
  location: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  exchangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  currencyBlock: {
    flex: 1,
    alignItems: "center",
  },
  currencyFlag: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  currencyAmount: {
    ...typography.labelMedium,
    color: colors.text.primary,
    textAlign: "center",
  },
  arrow: {
    marginHorizontal: spacing.sm,
  },
  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  rateLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginRight: spacing.xs,
  },
  rateValue: {
    ...typography.caption,
    color: colors.primary[600],
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  date: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  viewDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
});
