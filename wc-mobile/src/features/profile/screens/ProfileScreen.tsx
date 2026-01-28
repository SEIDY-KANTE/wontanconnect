/**
 * Profile Screen
 *
 * Shows different UI for authenticated users vs guests.
 */

import React, { useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  CommonActions,
  NavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  ProfileScreenProps,
  RootStackParamList,
} from "@/core/navigation/types";
import { Avatar, Card, ListItem, Divider } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { countryFlags } from "@/data/locations";
import { useFXStore } from "@/features/fx/store/fxStore";
import { useShippingStore } from "@/features/shipping/store/shippingStore";
import { useProfileStore } from "@/features/profile/store/profileStore";
import { useAppStore } from "@/core/store/appStore";
import { useIsGuest, useAuthStore } from "@/core/store/authStore";
import {
  useUserExchanges,
  useUserTrust,
} from "@/features/exchange/hooks/useExchange";
import { useExchangeStore } from "@/features/exchange/store/exchangeStore";
import { GuestProfileScreen } from "./GuestProfileScreen";

export const ProfileScreen: React.FC = () => {
  const isGuest = useIsGuest();

  // If guest, render the guest profile
  if (isGuest) {
    return <GuestProfileScreen />;
  }

  // Render authenticated profile
  return <AuthenticatedProfileScreen />;
};

const AuthenticatedProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<ProfileScreenProps<"Profile">["navigation"]>();
  const insets = useSafeAreaInsets();
  const { profile, loadProfile, isLoading: profileLoading } = useProfileStore();
  const authUser = useAuthStore((state) => state.user);
  const { logout } = useAppStore();
  const countryFlag = countryFlags[profile.country] || "🌍";
  const { offers: fxOffers, loadOffers: loadFxOffers } = useFXStore();
  const { offers: shippingOffers, loadOffers: loadShippingOffers } =
    useShippingStore();
  const { loadSessions } = useExchangeStore();
  const { fxExchanges, shippingExchanges, activeCount } = useUserExchanges();
  const {
    completedExchanges,
    averageRating,
    trustBadge,
    trustBadgeColor,
    trustBadgeIcon,
  } = useUserTrust();

  // Load profile from API on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!fxOffers.length) {
      loadFxOffers();
    }
  }, [fxOffers.length, loadFxOffers]);

  useEffect(() => {
    if (!shippingOffers.length) {
      loadShippingOffers();
    }
  }, [loadShippingOffers, shippingOffers.length]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Use auth user ID to match offers (more reliable than profile.id)
  const currentUserId = authUser?.id || profile.id;

  const myFxCount = useMemo(
    () => fxOffers.filter((offer) => offer.user.id === currentUserId).length,
    [currentUserId, fxOffers],
  );

  const myShippingCount = useMemo(
    () =>
      shippingOffers.filter((offer) => offer.user.id === currentUserId).length,
    [currentUserId, shippingOffers],
  );

  const handleSettingsPress = () => {
    navigation.navigate("Settings");
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleLogout = async () => {
    await logout();
    const rootNavigation = navigation
      .getParent()
      ?.getParent<NavigationProp<RootStackParamList>>();
    if (rootNavigation) {
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        }),
      );
    } else {
      navigation.navigate("Auth" as never);
    }
  };

  const menuItems = [
    {
      icon: "swap-horizontal-outline" as const,
      title: t("profile.myOffers"),
      subtitle: t("profile.activeOffers", { count: myFxCount }),
      onPress: () => navigation.navigate("MyFXOffers"),
    },
    {
      icon: "cube-outline" as const,
      title: t("profile.myAnnouncements"),
      subtitle: t("profile.activeAds", { count: myShippingCount }),
      onPress: () => navigation.navigate("MyShippingOffers"),
    },
    {
      icon: "repeat-outline" as const,
      title: t("exchange.fxExchanges"),
      subtitle: `${fxExchanges.length} ${t("exchange.trust.exchanges", { count: fxExchanges.length }).toLowerCase()}`,
      onPress: () => navigation.navigate("MyFXExchanges"),
    },
    {
      icon: "airplane-outline" as const,
      title: t("exchange.shippingExchanges"),
      subtitle: `${shippingExchanges.length} ${t("exchange.trust.exchanges", { count: shippingExchanges.length }).toLowerCase()}`,
      onPress: () => navigation.navigate("MyShippingExchanges"),
    },
    {
      icon: "settings-outline" as const,
      title: t("profile.settings"),
      onPress: handleSettingsPress,
    },
    {
      icon: "help-circle-outline" as const,
      title: t("profile.help"),
      onPress: () => navigation.navigate("HelpSupport"),
    },
    {
      icon: "information-circle-outline" as const,
      title: t("profile.about"),
      onPress: () => navigation.navigate("About"),
    },
  ];

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("profile.title")}</Text>
        </View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Avatar
                source={profile.avatar}
                name={profile.name}
                size="xl"
                verified={profile.isVerified}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.locationText}>
                    {countryFlag} {profile.city}
                  </Text>
                </View>
                <Text style={styles.memberSince}>
                  {t("profile.memberSince", {
                    date: formatMemberSince(profile.memberSince),
                  })}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{myFxCount}</Text>
                <Text style={styles.statLabel}>
                  {t("profile.stats.offers")}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedExchanges}</Text>
                <Text style={styles.statLabel}>{t("profile.stats.deals")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.ratingValue}>
                  <Ionicons
                    name="star"
                    size={16}
                    color={colors.secondary[500]}
                  />
                  <Text style={styles.statValue}>
                    {averageRating.toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.statLabel}>
                  {t("profile.stats.rating")}
                </Text>
              </View>
            </View>

            {/* Trust Badge */}
            {trustBadge && (
              <View
                style={[
                  styles.trustBadge,
                  { backgroundColor: trustBadgeColor + "15" },
                ]}
              >
                <Ionicons
                  name={trustBadgeIcon as any}
                  size={18}
                  color={trustBadgeColor}
                />
                <Text
                  style={[styles.trustBadgeText, { color: trustBadgeColor }]}
                >
                  {t(`exchange.trust.badge.${trustBadge.toLowerCase()}`)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={colors.primary[600]}
              />
              <Text style={styles.editButtonText}>
                {t("profile.editProfile")}
              </Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.menuCard} padding="none">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.title}>
                <ListItem
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={item.onPress}
                  leftIcon={
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={colors.text.secondary}
                    />
                  }
                />
                {index < menuItems.length - 1 && <Divider spacing="sm" />}
              </React.Fragment>
            ))}
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.logoutCard} padding="none">
            <ListItem
              title={t("profile.logout")}
              onPress={handleLogout}
              showChevron={false}
              leftIcon={
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colors.error.main}
                />
              }
            />
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing["4xl"],
  },
  header: {
    marginBottom: spacing.base,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    marginBottom: spacing.xl,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.base,
    justifyContent: "center",
  },
  profileName: {
    ...typography.h2,
    color: colors.text.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  memberSince: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  ratingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.light,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    marginTop: spacing.base,
    alignSelf: "center",
  },
  trustBadgeText: {
    ...typography.labelMedium,
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
  },
  editButtonText: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
  menuCard: {
    marginBottom: spacing.md,
  },
  logoutCard: {
    marginBottom: spacing.md,
  },
});
