/**
 * FX Detail Screen
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
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { FXScreenProps } from "@/core/navigation/types";
import { useFXStore } from "../store/fxStore";
import { currencyInfo } from "../data/mockData";
import { countryFlags } from "@/data/locations";
import { Avatar, Button, Tag, Card, GuestRestrictionModal } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";
import { TakeOfferModal } from "@/features/exchange/components/TakeOfferModal";
import { ExchangeRequestCard } from "@/features/exchange/components/ExchangeRequestCard";
import {
  useCreateExchangeSession,
  useOfferExchangeRequests,
} from "@/features/exchange/hooks/useExchange";
import { useExchangeStore } from "@/features/exchange/store/exchangeStore";
import { FXAgreedAmount } from "@/features/exchange/model/types";
import { useAppStore } from "@/core/store/appStore";
import { useProfileStore } from "@/features/profile/store/profileStore";
import { useIsGuest, useAuthStore } from "@/core/store/authStore";

export const FXDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<FXScreenProps<"FXDetail">["navigation"]>();
  const route = useRoute<FXScreenProps<"FXDetail">["route"]>();
  const insets = useSafeAreaInsets();
  const { getOfferById } = useFXStore();
  const { showToast } = useAppStore();
  const { profile } = useProfileStore();
  const { createFXSession, clearError, isCreating } =
    useCreateExchangeSession();
  const { pendingRequests, acceptRequest, declineRequest } =
    useOfferExchangeRequests(route.params.offerId);
  const {
    hasActiveSessionForOffer,
    getUserSessionForOffer,
    loadSessions,
    fetchSession,
    sessions,
  } = useExchangeStore();
  const isGuest = useIsGuest();
  const authUser = useAuthStore((state) => state.user);

  const [showTakeOfferModal, setShowTakeOfferModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestFeature, setGuestFeature] = useState<string | undefined>();

  // Get the offer first so we can access it in effects
  const offer = getOfferById(route.params.offerId);

  // Get existing session for this user and offer
  const existingSession = authUser?.id
    ? getUserSessionForOffer(offer?.id || "", authUser.id)
    : undefined;

  // Load sessions when screen mounts/focuses to get latest data including conversationIds
  useEffect(() => {
    if (!isGuest) {
      loadSessions();
    }
  }, [loadSessions, isGuest]);

  // Fetch the specific session to get fresh conversationId
  useEffect(() => {
    if (existingSession?.id && !isGuest) {
      fetchSession(existingSession.id);
    }
  }, [existingSession?.id, fetchSession, isGuest]);

  // Also reload when screen comes into focus (for navigation back)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!isGuest) {
        loadSessions();
        // Also refetch the specific session
        if (existingSession?.id) {
          fetchSession(existingSession.id);
        }
      }
    });
    return unsubscribe;
  }, [navigation, loadSessions, fetchSession, existingSession?.id, isGuest]);

  if (!offer) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Offer not found</Text>
      </View>
    );
  }

  // Check if current user is the offer owner (use auth user ID)
  const isOwnOffer = authUser?.id === offer.user.id;

  // Check if user already has an active session for this offer
  const hasExistingSession = authUser?.id
    ? hasActiveSessionForOffer(offer.id, authUser.id)
    : false;

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

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " " + currency;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleContact = () => {
    // Check if guest - show modal instead of navigating
    if (isGuest) {
      setGuestFeature(t("messages.title"));
      setShowGuestModal(true);
      return;
    }

    // Check if there's an existing session with a conversation
    if (existingSession?.conversationId) {
      navigation.getParent()?.navigate("MessagesTab", {
        screen: "Chat",
        params: {
          conversationId: existingSession.conversationId,
          recipientName: offer.user.name,
          exchangeId: existingSession.id,
        },
      });
    } else {
      // No existing conversation - prompt user to create an exchange first
      showToast(
        "info",
        t(
          "exchange.noConversationYet",
          "Start an exchange to message this user",
        ),
      );
    }
  };

  const handleTakeOfferPress = () => {
    // Check if guest - show modal instead of opening take offer modal
    if (isGuest) {
      setGuestFeature(t("exchange.takeOffer.title"));
      setShowGuestModal(true);
      return;
    }
    setShowTakeOfferModal(true);
  };

  const handleTakeOffer = async (agreedAmount: FXAgreedAmount) => {
    // Guest check already done in handleTakeOfferPress, but double-check
    if (isGuest) {
      setGuestFeature(t("exchange.takeOffer.title"));
      setShowGuestModal(true);
      return;
    }

    // Clear any previous errors
    clearError();

    // Create exchange session
    const session = await createFXSession(offer.id, offer.user, agreedAmount);

    // Close modal after API call completes (success or failure)
    setShowTakeOfferModal(false);

    if (!session) {
      showToast("error", t("exchange.takeOffer.error"));
      return;
    }

    // Show success toast
    showToast("success", t("exchange.takeOffer.success"));

    // Navigate to chat with exchange context (only if conversation exists)
    if (session.conversationId) {
      navigation.getParent()?.navigate("MessagesTab", {
        screen: "Chat",
        params: {
          conversationId: session.conversationId,
          recipientName: offer.user.name,
          exchangeId: session.id,
        },
      });
    } else {
      // Conversation will be created when session is accepted
      // Navigate to the exchange detail or back
      showToast(
        "info",
        t(
          "exchange.requestSent",
          "Request sent! Chat will be available once accepted.",
        ),
      );
    }
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
        <Text style={styles.headerTitle}>{t("fx.title")}</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.userCard}>
            <View style={styles.userRow}>
              <Avatar
                source={offer.user.avatar}
                name={offer.user.name}
                size="lg"
                verified={offer.user.isVerified}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{offer.user.name}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.userLocation}>
                    {countryFlag} {offer.location.city}
                  </Text>
                  {offer.user.rating !== undefined && offer.user.rating > 0 && (
                    <View style={styles.rating}>
                      <Ionicons
                        name="star"
                        size={14}
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
              <Tag
                label={t(`fx.filters.${offer.type}`)}
                variant={offer.type === "selling" ? "success" : "primary"}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Exchange Details */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.exchangeCard}>
            <View style={styles.exchangeRow}>
              <View style={styles.currencySection}>
                <Text style={styles.currencyLabel}>{t("fx.from")}</Text>
                <View style={styles.currencyBox}>
                  <Text style={styles.currencyFlag}>{fromCurrency.flag}</Text>
                  <Text style={styles.currencyAmount}>
                    {formatAmount(offer.amountFrom, offer.fromCurrency)}
                  </Text>
                  <Text style={styles.currencyName}>{fromCurrency.name}</Text>
                </View>
              </View>

              <View style={styles.arrowContainer}>
                <View style={styles.arrowCircle}>
                  <Ionicons
                    name="swap-horizontal"
                    size={24}
                    color={colors.primary[600]}
                  />
                </View>
              </View>

              <View style={styles.currencySection}>
                <Text style={styles.currencyLabel}>{t("fx.to")}</Text>
                <View style={styles.currencyBox}>
                  <Text style={styles.currencyFlag}>{toCurrency.flag}</Text>
                  <Text style={styles.currencyAmount}>
                    {offer.amountTo
                      ? formatAmount(offer.amountTo, offer.toCurrency)
                      : "—"}
                  </Text>
                  <Text style={styles.currencyName}>{toCurrency.name}</Text>
                </View>
              </View>
            </View>

            {offer.rate !== undefined && offer.rate !== null && (
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>{t("fx.rate")}</Text>
                <Text style={styles.rateValue}>
                  1 {offer.fromCurrency} = {offer.rate.toLocaleString("fr-FR")}{" "}
                  {offer.toCurrency}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Description */}
        {offer.description && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <Card style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{offer.description}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Pending Exchange Requests (Only for offer owner) */}
        {isOwnOffer && pendingRequests.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)}>
            <View style={styles.requestsSection}>
              <Text style={styles.requestsSectionTitle}>
                {t("exchange.requests.pending")}
              </Text>
              <Text style={styles.requestsSectionSubtitle}>
                {pendingRequests.length}{" "}
                {t("exchange.requests.pending").toLowerCase()}
              </Text>
              {pendingRequests.map((session) => (
                <ExchangeRequestCard
                  key={session.id}
                  session={session}
                  onAccept={() => acceptRequest(session.id)}
                  onDecline={() => declineRequest(session.id)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Trust Banner */}
        <Animated.View
          entering={FadeInUp.delay(
            isOwnOffer && pendingRequests.length > 0 ? 500 : 400,
          )}
        >
          <View style={styles.trustBanner}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.warning.dark}
            />
            <View style={styles.trustText}>
              <Text style={styles.trustTitle}>
                {t("fx.detail.trustBanner")}
              </Text>
              <Text style={styles.trustMessage}>
                {t("fx.detail.trustMessage")}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Posted date */}
        <Text style={styles.postedDate}>
          {t("fx.postedOn")} {formatDate(offer.createdAt)}
        </Text>
      </ScrollView>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeIn.delay(500)}
        style={[
          styles.bottomCTA,
          { paddingBottom: insets.bottom || spacing.base },
        ]}
      >
        {isOwnOffer ? (
          // Owner sees contact/edit option
          <Button
            label={t("common.edit")}
            onPress={() =>
              navigation.navigate("FXCreate", { offerId: offer.id })
            }
            variant="secondary"
            size="lg"
            fullWidth
            icon={
              <Ionicons
                name="pencil-outline"
                size={20}
                color={colors.primary[600]}
              />
            }
          />
        ) : (
          // Non-owner sees Take Offer as primary, Contact as secondary
          <View style={styles.ctaButtons}>
            {hasExistingSession ? (
              // User already has an active session - show status button
              <Button
                label={
                  existingSession?.status === "PENDING_APPROVAL"
                    ? t("exchange.status.pending")
                    : t("exchange.status.inProgress")
                }
                onPress={() => {
                  // Navigate to the existing session chat (only if conversation exists)
                  if (existingSession?.conversationId) {
                    navigation.getParent()?.navigate("MessagesTab", {
                      screen: "Chat",
                      params: {
                        conversationId: existingSession.conversationId,
                        recipientName: offer.user.name,
                        exchangeId: existingSession.id,
                      },
                    });
                  } else {
                    // Pending sessions don't have conversations yet
                    showToast(
                      "info",
                      t(
                        "exchange.waitingForAcceptance",
                        "Waiting for the owner to accept your request",
                      ),
                    );
                  }
                }}
                variant="secondary"
                size="lg"
                style={styles.takeOfferButton}
                icon={
                  <Ionicons
                    name={
                      existingSession?.status === "PENDING_APPROVAL"
                        ? "time-outline"
                        : "checkmark-circle-outline"
                    }
                    size={20}
                    color={colors.primary[600]}
                  />
                }
              />
            ) : (
              // No existing session - show Take Offer button
              <Button
                label={t("exchange.takeOffer.title")}
                onPress={handleTakeOfferPress}
                variant="primary"
                size="lg"
                style={styles.takeOfferButton}
                icon={
                  <Ionicons
                    name="swap-horizontal"
                    size={20}
                    color={colors.neutral[0]}
                  />
                }
              />
            )}
            {/* <Button
              label={t("fx.detail.contact")}
              onPress={handleContact}
              variant="outline"
              size="lg"
              style={styles.contactButton}
              icon={
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={colors.primary[600]}
                />
              }
            /> */}
          </View>
        )}
      </Animated.View>

      {/* Take Offer Modal */}
      <TakeOfferModal
        visible={showTakeOfferModal}
        onClose={() => !isCreating && setShowTakeOfferModal(false)}
        offer={offer}
        onSubmit={handleTakeOffer}
        isSubmitting={isCreating}
      />

      {/* Guest Restriction Modal */}
      <GuestRestrictionModal
        visible={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        feature={guestFeature}
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
    paddingBottom: 120,
  },
  userCard: {
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  userMeta: {
    marginTop: spacing.xs,
  },
  userLocation: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xxs,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  exchangeCard: {
    marginBottom: spacing.md,
  },
  exchangeRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  currencySection: {
    flex: 1,
  },
  currencyLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  currencyBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: "center",
  },
  currencyFlag: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  currencyAmount: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
  },
  currencyName: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  arrowContainer: {
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xl,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  rateBox: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  rateValue: {
    ...typography.labelLarge,
    color: colors.primary[600],
  },
  descriptionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  trustBanner: {
    flexDirection: "row",
    backgroundColor: colors.warning.light,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  trustText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  trustTitle: {
    ...typography.labelMedium,
    color: colors.warning.dark,
    marginBottom: spacing.xxs,
  },
  trustMessage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  postedDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: "center",
  },
  requestsSection: {
    marginBottom: spacing.md,
  },
  requestsSectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  requestsSectionSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  takeOfferButton: {
    flex: 2,
  },
  contactButton: {
    flex: 1,
  },
});
