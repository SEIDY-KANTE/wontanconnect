/**
 * Exchange Detail Screen
 *
 * Shows full details of an exchange session with confirmation and rating.
 */

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ProfileScreenProps } from "@/core/navigation/types";
import { Card, Avatar, Button, Divider } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";
import {
  useExchangeSession,
  useExchangeConfirmation,
  useExchangeRating,
} from "@/features/exchange/hooks/useExchange";
import {
  ExchangeConfirmationButton,
  ExchangeConfirmationStatus,
  RatingModal,
} from "@/features/exchange/components";
import {
  FXAgreedAmount,
  isFXExchange,
  ExchangeStatus,
} from "@/features/exchange/model/types";
import { useAppStore } from "@/core/store/appStore";

const getStatusConfig = (
  status: ExchangeStatus,
): { color: string; label: string; icon: string } => {
  switch (status) {
    case "PENDING_APPROVAL":
      return {
        color: colors.warning.main,
        label: "exchange.status.pending_approval",
        icon: "time-outline",
      };
    case "IN_PROGRESS":
      return {
        color: colors.info.main,
        label: "exchange.status.in_progress",
        icon: "sync-outline",
      };
    case "IN_TRANSIT":
      return {
        color: colors.info.main,
        label: "exchange.status.in_transit",
        icon: "airplane-outline",
      };
    case "DELIVERED_PENDING_CONFIRMATION":
      return {
        color: colors.warning.main,
        label: "exchange.status.delivered_pending",
        icon: "cube-outline",
      };
    case "COMPLETED":
      return {
        color: colors.success.main,
        label: "exchange.status.completed",
        icon: "checkmark-circle",
      };
    case "CANCELLED":
      return {
        color: colors.error.main,
        label: "exchange.status.cancelled",
        icon: "close-circle",
      };
    default:
      return {
        color: colors.neutral[500],
        label: "common.status.active",
        icon: "ellipse",
      };
  }
};

export const ExchangeDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ProfileScreenProps<"ExchangeDetail">["navigation"]>();
  const route = useRoute<ProfileScreenProps<"ExchangeDetail">["route"]>();
  const insets = useSafeAreaInsets();
  const { showToast } = useAppStore();

  const { exchangeId } = route.params;

  const {
    session,
    isInitiator,
    partner,
    hasConfirmed,
    partnerHasConfirmed,
    isCompleted,
    confirmAction,
  } = useExchangeSession(exchangeId);

  const { confirmationLabel, canUserConfirmAction } =
    useExchangeConfirmation(session);

  const { canRate, hasRated, submitRating } = useExchangeRating(session);

  const [showRatingModal, setShowRatingModal] = useState(false);

  // Show rating modal automatically after completion
  useEffect(() => {
    if (isCompleted && canRate && !hasRated) {
      // Delay to let user see the completion state
      const timer = setTimeout(() => {
        setShowRatingModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, canRate, hasRated]);

  if (!session || !partner) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>{t("common.loading")}</Text>
      </View>
    );
  }

  const statusConfig = getStatusConfig(session.status);

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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenChat = () => {
    if (!session.conversationId) {
      showToast(
        "info",
        t(
          "exchange.chat.notAvailableYet",
          "Chat will be available once the exchange is accepted.",
        ),
      );
      return;
    }
    navigation.getParent()?.navigate("MessagesTab", {
      screen: "Chat",
      params: {
        conversationId: session.conversationId,
        recipientName: partner.name,
        exchangeId: session.id,
      },
    });
  };

  const handleConfirm = () => {
    confirmAction();
    showToast("success", t("exchange.confirm.youConfirmed"));
  };

  const handleRatingSubmit = (rating: number, comment?: string) => {
    submitRating(rating, comment);
    showToast("success", t("exchange.rating.success"));
  };

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
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("exchange.detail.title")}</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: statusConfig.color + "20" },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {t(statusConfig.label)}
            </Text>
          </View>
        </Animated.View>

        {/* Partner Card */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.partnerCard}>
            <Text style={styles.sectionLabel}>
              {t("exchange.detail.partner")}
            </Text>
            <View style={styles.partnerRow}>
              <Avatar
                source={partner.avatar}
                name={partner.name}
                size="lg"
                verified={partner.isVerified}
              />
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{partner.name}</Text>
                {partner.rating !== undefined && partner.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons
                      name="star"
                      size={14}
                      color={colors.secondary[500]}
                    />
                    <Text style={styles.ratingText}>
                      {partner.rating} ({partner.totalDeals || 0}{" "}
                      {t("profile.stats.deals").toLowerCase()})
                    </Text>
                  </View>
                )}
                <Text style={styles.roleText}>
                  {isInitiator
                    ? t("exchange.detail.taker")
                    : t("exchange.detail.initiator")}
                </Text>
              </View>
              <Button
                label={
                  session.conversationId
                    ? t("fx.detail.contact")
                    : t("common.pending", "Pending...")
                }
                onPress={handleOpenChat}
                variant="outline"
                size="sm"
                disabled={!session.conversationId}
                icon={
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={
                      session.conversationId
                        ? colors.primary[600]
                        : colors.text.tertiary
                    }
                  />
                }
              />
            </View>
          </Card>
        </Animated.View>

        {/* Exchange Details */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionLabel}>
              {session.type === "FX" ? t("tabs.fx") : t("tabs.shipping")}
            </Text>

            {isFXExchange(session) && (
              <View style={styles.amountContainer}>
                <View style={styles.amountBox}>
                  <Text style={styles.amountLabel}>
                    {t("exchange.takeOffer.youSend")}
                  </Text>
                  <Text style={styles.amountValue}>
                    {formatAmount(
                      (session.agreedAmount as FXAgreedAmount).fromAmount,
                      (session.agreedAmount as FXAgreedAmount).fromCurrency,
                    )}
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.amountLabel}>
                    {t("exchange.takeOffer.youReceive")}
                  </Text>
                  <Text
                    style={[styles.amountValue, styles.amountValueHighlight]}
                  >
                    {(session.agreedAmount as FXAgreedAmount).toAmount !==
                    undefined
                      ? formatAmount(
                          (session.agreedAmount as FXAgreedAmount).toAmount,
                          (session.agreedAmount as FXAgreedAmount).toCurrency,
                        )
                      : t("common.negotiable", "To be agreed")}
                  </Text>
                </View>
              </View>
            )}

            <Divider spacing="md" />

            {/* Timeline */}
            <Text style={styles.timelineLabel}>
              {t("exchange.detail.timeline")}
            </Text>
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text style={styles.timelineText}>
                  {t("exchange.detail.created")}:{" "}
                  {formatDate(session.createdAt)}
                </Text>
              </View>
              {session.status !== "PENDING_APPROVAL" &&
                session.status !== "CANCELLED" && (
                  <View style={styles.timelineItem}>
                    <Ionicons
                      name="checkmark-outline"
                      size={16}
                      color={colors.success.main}
                    />
                    <Text style={styles.timelineText}>
                      {t("exchange.detail.accepted")}:{" "}
                      {formatDate(session.updatedAt)}
                    </Text>
                  </View>
                )}
              {session.completedAt && (
                <View style={styles.timelineItem}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={16}
                    color={colors.success.main}
                  />
                  <Text style={styles.timelineText}>
                    {t("exchange.detail.completed")}:{" "}
                    {formatDate(session.completedAt)}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Confirmation Section */}
        {session.status === "IN_PROGRESS" && (
          <Animated.View entering={FadeInUp.delay(400)}>
            <Card style={styles.confirmationCard}>
              <Text style={styles.sectionLabel}>
                {t("exchange.confirm.title")}
              </Text>

              <ExchangeConfirmationStatus
                initiatorName={session.initiator.name}
                takerName={session.taker.name}
                initiatorConfirmed={session.confirmations.initiatorConfirmed}
                takerConfirmed={session.confirmations.takerConfirmed}
                isCurrentUserInitiator={isInitiator}
              />

              {canUserConfirmAction && (
                <View style={styles.confirmButtonContainer}>
                  <ExchangeConfirmationButton
                    label={confirmationLabel}
                    isConfirmed={hasConfirmed}
                    _isPartnerConfirmed={partnerHasConfirmed}
                    onConfirm={handleConfirm}
                  />
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Rating Section (after completion) */}
        {isCompleted && (
          <Animated.View entering={FadeInUp.delay(500)}>
            <Card style={styles.ratingCard}>
              <View style={styles.completedBanner}>
                <Ionicons
                  name="checkmark-done-circle"
                  size={32}
                  color={colors.success.main}
                />
                <Text style={styles.completedTitle}>
                  {t("exchange.confirm.bothConfirmed")}
                </Text>
              </View>

              {canRate && !hasRated ? (
                <Button
                  label={t("exchange.chat.rateExchange")}
                  onPress={() => setShowRatingModal(true)}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon={
                    <Ionicons
                      name="star-outline"
                      size={20}
                      color={colors.primary[600]}
                    />
                  }
                />
              ) : hasRated ? (
                <View style={styles.ratedBadge}>
                  <Ionicons
                    name="star"
                    size={20}
                    color={colors.secondary[500]}
                  />
                  <Text style={styles.ratedText}>
                    {t("exchange.rating.alreadyRated")}
                  </Text>
                </View>
              ) : null}
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        partner={partner}
        onSubmit={handleRatingSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  backButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusText: {
    ...typography.labelLarge,
    fontWeight: "600",
  },
  partnerCard: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  partnerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  partnerName: {
    ...typography.h3,
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
    marginLeft: spacing.xs,
  },
  roleText: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  detailsCard: {
    marginBottom: spacing.md,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  amountBox: {
    flex: 1,
  },
  arrowContainer: {
    paddingHorizontal: spacing.md,
  },
  amountLabel: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  amountValue: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  amountValueHighlight: {
    color: colors.success.dark,
  },
  timelineLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  timeline: {
    gap: spacing.sm,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timelineText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  confirmationCard: {
    marginBottom: spacing.md,
  },
  confirmButtonContainer: {
    marginTop: spacing.base,
  },
  ratingCard: {
    marginBottom: spacing.md,
  },
  completedBanner: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  completedTitle: {
    ...typography.h3,
    color: colors.success.dark,
    marginTop: spacing.sm,
  },
  ratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary[50],
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  ratedText: {
    ...typography.labelMedium,
    color: colors.secondary[700],
  },
});
