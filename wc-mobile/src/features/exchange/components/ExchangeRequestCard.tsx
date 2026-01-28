/**
 * Exchange Request Card
 *
 * Card component for displaying pending exchange requests.
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card, Avatar, Button, Tag } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { ExchangeSession, isFXExchange, FXAgreedAmount } from "../model/types";

interface ExchangeRequestCardProps {
  session: ExchangeSession;
  onAccept: () => void;
  onDecline: () => void;
  index?: number;
}

export const ExchangeRequestCard: React.FC<ExchangeRequestCardProps> = ({
  session,
  onAccept,
  onDecline,
  index = 0,
}) => {
  const { t } = useTranslation();

  const formatAmount = (amount: number, currency: string) => {
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 2,
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderAmountInfo = () => {
    if (isFXExchange(session)) {
      const amount = session.agreedAmount as FXAgreedAmount;
      return (
        <View style={styles.amountRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>
              {t("exchange.takeOffer.youReceive")}
            </Text>
            <Text style={styles.amountValue}>
              {formatAmount(amount.fromAmount, amount.fromCurrency)}
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={colors.text.tertiary}
          />
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>
              {t("exchange.takeOffer.youSend")}
            </Text>
            <Text style={styles.amountValue}>
              {amount.toAmount !== undefined
                ? formatAmount(amount.toAmount, amount.toCurrency)
                : t("common.negotiable", "TBD")}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar
            source={session.taker.avatar}
            name={session.taker.name}
            size="md"
            verified={session.taker.isVerified}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{session.taker.name}</Text>
            {session.taker.rating !== undefined && session.taker.rating > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={colors.secondary[500]} />
                <Text style={styles.ratingText}>
                  {session.taker.rating} ({session.taker.totalDeals || 0})
                </Text>
              </View>
            )}
          </View>
          <Tag
            label={
              session.agreedAmount &&
              "isFullAmount" in session.agreedAmount &&
              session.agreedAmount.isFullAmount
                ? t("exchange.takeOffer.fullAmount")
                : t("exchange.takeOffer.customAmount")
            }
            variant="info"
            size="sm"
          />
        </View>

        {/* Amount Info */}
        {renderAmountInfo()}

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {t("exchange.detail.created")}: {formatDate(session.createdAt)}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={t("exchange.requests.decline")}
            onPress={onDecline}
            variant="ghost"
            size="md"
            style={styles.declineButton}
          />
          <Button
            label={t("exchange.requests.accept")}
            onPress={onAccept}
            variant="primary"
            size="md"
            style={styles.acceptButton}
          />
        </View>
      </Card>
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
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  amountBox: {
    flex: 1,
  },
  amountLabel: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.xxs,
  },
  amountValue: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  timestamp: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
});
