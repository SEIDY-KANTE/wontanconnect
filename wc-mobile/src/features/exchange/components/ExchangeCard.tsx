/**
 * Exchange Card
 *
 * Card component for displaying exchange sessions in lists.
 */

import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card, Avatar } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import {
  ExchangeSession,
  ExchangeStatus,
  isFXExchange,
  FXAgreedAmount,
  ShippingAgreedAmount,
} from "../model/types";
import { CURRENT_USER_ID } from "../store/exchangeStore";

interface ExchangeCardProps {
  session: ExchangeSession;
  onPress: () => void;
  index?: number;
}

const getStatusConfig = (
  status: ExchangeStatus,
): { color: string; label: string } => {
  switch (status) {
    case "PENDING_APPROVAL":
      return {
        color: colors.warning.main,
        label: "exchange.status.pending_approval",
      };
    case "IN_PROGRESS":
      return { color: colors.info.main, label: "exchange.status.in_progress" };
    case "IN_TRANSIT":
      return { color: colors.info.main, label: "exchange.status.in_transit" };
    case "DELIVERED_PENDING_CONFIRMATION":
      return {
        color: colors.warning.main,
        label: "exchange.status.delivered_pending",
      };
    case "COMPLETED":
      return { color: colors.success.main, label: "exchange.status.completed" };
    case "CANCELLED":
      return { color: colors.error.main, label: "exchange.status.cancelled" };
    default:
      return { color: colors.neutral[500], label: "common.status.active" };
  }
};

export const ExchangeCard: React.FC<ExchangeCardProps> = ({
  session,
  onPress,
  index = 0,
}) => {
  const { t } = useTranslation();

  const isInitiator = session.initiatorUserId === CURRENT_USER_ID;
  const partner = isInitiator ? session.taker : session.initiator;
  const statusConfig = getStatusConfig(session.status);

  const formatAmount = (amount: number, currency: string) => {
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }).format(amount) +
      " " +
      currency
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const renderAmountSummary = () => {
    if (isFXExchange(session)) {
      const amount = session.agreedAmount as FXAgreedAmount;
      return (
        <Text style={styles.amountText}>
          {formatAmount(amount.fromAmount, amount.fromCurrency)} →{" "}
          {amount.toAmount !== undefined
            ? formatAmount(amount.toAmount, amount.toCurrency)
            : t("common.negotiable", "TBD")}
        </Text>
      );
    } else {
      const amount = session.agreedAmount as ShippingAgreedAmount;
      return (
        <Text style={styles.amountText} numberOfLines={1}>
          {amount.description}
        </Text>
      );
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80)}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Avatar
              source={partner.avatar}
              name={partner.name}
              size="md"
              verified={partner.isVerified}
            />
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.partnerName} numberOfLines={1}>
                  {t("exchange.card.with")} {partner.name}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {formatDate(session.createdAt)}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusConfig.color },
                ]}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {t(statusConfig.label)}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.typeRow}>
              <Ionicons
                name={
                  session.type === "FX" ? "swap-horizontal" : "cube-outline"
                }
                size={16}
                color={colors.primary[600]}
              />
              <Text style={styles.typeText}>
                {session.type === "FX" ? t("tabs.fx") : t("tabs.shipping")}
              </Text>
            </View>
            {renderAmountSummary()}
          </View>

          {/* Confirmation Progress */}
          {session.status === "IN_PROGRESS" && (
            <View style={styles.confirmationRow}>
              <View style={styles.confirmationItem}>
                <Ionicons
                  name={
                    session.confirmations.initiatorConfirmed
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={16}
                  color={
                    session.confirmations.initiatorConfirmed
                      ? colors.success.main
                      : colors.text.tertiary
                  }
                />
                <Text style={styles.confirmationText}>
                  {isInitiator
                    ? t("common.you")
                    : session.initiator.name.split(" ")[0]}
                </Text>
              </View>
              <View style={styles.confirmationDivider} />
              <View style={styles.confirmationItem}>
                <Ionicons
                  name={
                    session.confirmations.takerConfirmed
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={16}
                  color={
                    session.confirmations.takerConfirmed
                      ? colors.success.main
                      : colors.text.tertiary
                  }
                />
                <Text style={styles.confirmationText}>
                  {!isInitiator
                    ? t("common.you")
                    : session.taker.name.split(" ")[0]}
                </Text>
              </View>
            </View>
          )}

          {/* Action hint */}
          <View style={styles.footer}>
            <Text style={styles.actionHint}>
              {t("exchange.card.viewDetails")}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.tertiary}
            />
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  partnerName: {
    ...typography.labelLarge,
    color: colors.text.primary,
    flex: 1,
  },
  dateText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.captionSmall,
    fontWeight: "600",
  },
  content: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  typeText: {
    ...typography.caption,
    color: colors.primary[600],
    marginLeft: spacing.xs,
    fontWeight: "600",
  },
  amountText: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  confirmationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  confirmationItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  confirmationText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  confirmationDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  actionHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginRight: spacing.xxs,
  },
});
