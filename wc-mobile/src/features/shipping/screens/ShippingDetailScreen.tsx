/**
 * Shipping Detail Screen
 */

import React, { useState, useCallback, useEffect } from "react";
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

import { ShippingScreenProps } from "@/core/navigation/types";
import { useShippingStore } from "../store/shippingStore";
import { shippingTypeIcons } from "../data/mockData";
import { countryFlags } from "@/data/locations";
import { Avatar, Button, Tag, Card, GuestRestrictionModal } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";
import { useProfileStore } from "@/features/profile/store/profileStore";
import { useIsGuest, useAuthStore } from "@/core/store/authStore";
import { useAppStore } from "@/core/store/appStore";
import {
  TakeShippingOfferModal,
  ExchangeRequestCard,
} from "@/features/exchange/components";
import {
  useCreateExchangeSession,
  useOfferExchangeRequests,
} from "@/features/exchange/hooks/useExchange";
import { useExchangeStore } from "@/features/exchange/store/exchangeStore";

export const ShippingDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ShippingScreenProps<"ShippingDetail">["navigation"]>();
  const route = useRoute<ShippingScreenProps<"ShippingDetail">["route"]>();
  const insets = useSafeAreaInsets();
  const { getOfferById } = useShippingStore();
  const { profile } = useProfileStore();
  const { showToast } = useAppStore();
  const { createShippingSession, clearError, isCreating } =
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

  // Check if user already has an active session for this offer
  const hasExistingSession = authUser?.id
    ? hasActiveSessionForOffer(offer.id, authUser.id)
    : false;

  const fromFlag = countryFlags[offer.fromCountry] || "🌍";
  const toFlag = countryFlags[offer.toCountry] || "🌍";
  const typeIcon = shippingTypeIcons[
    offer.type
  ] as keyof typeof Ionicons.glyphMap;

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

  const isOwner = authUser?.id === offer.user.id;

  const handleTakeOffer = useCallback(
    async (data: { description: string; weight?: string }) => {
      // Guest check already done in handleTakeOfferPress
      if (isGuest) return;

      // Clear any previous errors
      clearError();

      const session = await createShippingSession(offer.id, offer.user, {
        description: data.description,
        weight: data.weight,
        price: offer.price,
      });

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
        showToast(
          "info",
          t(
            "exchange.requestSent",
            "Request sent! Chat will be available once accepted.",
          ),
        );
      }
    },
    [
      createShippingSession,
      offer,
      navigation,
      clearError,
      isGuest,
      showToast,
      t,
    ],
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
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("shipping.title")}</Text>
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
                label={t(`shipping.types.${offer.type}`)}
                variant="info"
                icon={
                  <Ionicons
                    name={typeIcon}
                    size={14}
                    color={colors.info.dark}
                  />
                }
              />
            </View>
          </Card>
        </Animated.View>

        {/* Route Card */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>{t("shipping.from")}</Text>
                <Text style={styles.routeFlag}>{fromFlag}</Text>
                <Text style={styles.routeCity}>{offer.fromCity}</Text>
              </View>

              <View style={styles.routeLineVertical}>
                <View style={styles.routeDot} />
                <View style={styles.routeDashVertical} />
                <Ionicons
                  name="airplane"
                  size={20}
                  color={colors.primary[500]}
                />
                <View style={styles.routeDashVertical} />
                <View style={styles.routeDot} />
              </View>

              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>{t("shipping.to")}</Text>
                <Text style={styles.routeFlag}>{toFlag}</Text>
                <Text style={styles.routeCity}>{offer.toCity}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Details Card */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary[600]}
                />
                <View>
                  <Text style={styles.detailLabel}>{t("shipping.date")}</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(offer.departureDate)}
                  </Text>
                </View>
              </View>
            </View>

            {offer.capacity && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="cube-outline"
                    size={20}
                    color={colors.primary[600]}
                  />
                  <View>
                    <Text style={styles.detailLabel}>
                      {t("shipping.capacity")}
                    </Text>
                    <Text style={styles.detailValue}>{offer.capacity}</Text>
                  </View>
                </View>
              </View>
            )}

            {offer.price && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={colors.primary[600]}
                  />
                  <View>
                    <Text style={styles.detailLabel}>
                      {t("shipping.price")}
                    </Text>
                    <Text style={styles.detailValue}>{offer.price}</Text>
                  </View>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Description */}
        {offer.description && (
          <Animated.View entering={FadeInUp.delay(400)}>
            <Card style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{offer.description}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Pending Exchange Requests (Only for offer owner) */}
        {isOwner && pendingRequests.length > 0 && (
          <Animated.View entering={FadeInUp.delay(500)}>
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
            isOwner && pendingRequests.length > 0 ? 600 : 500,
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
                {t("shipping.detail.trustBanner")}
              </Text>
              <Text style={styles.trustMessage}>
                {t("shipping.detail.trustMessage")}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.postedDate}>
          {t("fx.postedOn")} {formatDate(offer.createdAt)}
        </Text>
      </ScrollView>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeIn.delay(600)}
        style={[
          styles.bottomCTA,
          { paddingBottom: insets.bottom || spacing.base },
        ]}
      >
        {isOwner ? (
          <Button
            label={t("shipping.detail.contact")}
            onPress={handleContact}
            variant="primary"
            size="lg"
            fullWidth
            icon={
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={colors.neutral[0]}
              />
            }
          />
        ) : (
          <View style={styles.ctaRow}>
            {/* <Button 
              label={t("shipping.detail.contact")}
              onPress={handleContact}
              variant="outline"
              size="lg"
              style={styles.ctaButton}
              icon={
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={colors.primary[600]}
                />
              }
            /> */}
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
                style={styles.ctaButton}
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
                label={t("exchange.takeOffer.shippingTitle")}
                onPress={handleTakeOfferPress}
                variant="primary"
                size="lg"
                style={styles.ctaButton}
                icon={
                  <Ionicons
                    name="send-outline"
                    size={20}
                    color={colors.neutral[0]}
                  />
                }
              />
            )}
          </View>
        )}
      </Animated.View>

      {/* Take Shipping Offer Modal */}
      <TakeShippingOfferModal
        visible={showTakeOfferModal}
        onClose={() => setShowTakeOfferModal(false)}
        onSubmit={handleTakeOffer}
        offer={offer}
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
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  routeCard: {
    marginBottom: spacing.md,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routePoint: {
    flex: 1,
    alignItems: "center",
  },
  routeLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  routeFlag: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  routeCity: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
  },
  routeLineVertical: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[400],
  },
  routeDashVertical: {
    width: 2,
    height: 20,
    backgroundColor: colors.primary[200],
  },
  detailsCard: {
    marginBottom: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  detailValue: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginTop: spacing.xxs,
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
  ctaRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ctaButton: {
    flex: 1,
  },
});
