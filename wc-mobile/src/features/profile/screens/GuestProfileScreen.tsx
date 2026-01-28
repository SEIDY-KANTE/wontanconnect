/**
 * Guest Profile Screen
 *
 * A differentiated profile experience for guest users.
 * Shows limited features and encourages registration.
 */

import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ProfileScreenProps } from "@/core/navigation/types";
import { Card, Button, ListItem, Divider } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";
import { useAuthStore } from "@/core/store/authStore";

interface BenefitItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
}

const BenefitItem: React.FC<BenefitItemProps> = ({
  icon,
  title,
  description,
  delay,
}) => (
  <Animated.View entering={FadeInDown.delay(delay)} style={styles.benefitItem}>
    <View style={styles.benefitIconContainer}>
      <Ionicons name={icon} size={24} color={colors.primary[600]} />
    </View>
    <View style={styles.benefitContent}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  </Animated.View>
);

export const GuestProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ProfileScreenProps<"Profile">["navigation"]>();
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();

  const handleRegister = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" as never, params: { screen: "Register" } }],
    });
  };

  const handleLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" as never, params: { screen: "Login" } }],
    });
  };

  const handleExitGuest = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" as never }],
    });
  };

  const benefits = [
    {
      icon: "swap-horizontal" as const,
      title: t("guest.profile.benefits.exchange.title"),
      description: t("guest.profile.benefits.exchange.description"),
    },
    {
      icon: "chatbubbles" as const,
      title: t("guest.profile.benefits.messaging.title"),
      description: t("guest.profile.benefits.messaging.description"),
    },
    {
      icon: "shield-checkmark" as const,
      title: t("guest.profile.benefits.trust.title"),
      description: t("guest.profile.benefits.trust.description"),
    },
    {
      icon: "notifications" as const,
      title: t("guest.profile.benefits.notifications.title"),
      description: t("guest.profile.benefits.notifications.description"),
    },
  ];

  const guestMenuItems = [
    {
      icon: "settings-outline" as const,
      title: t("profile.settings"),
      onPress: () => navigation.navigate("Settings"),
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <LinearGradient
            colors={gradients.brandSoft}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Guest Avatar */}
            <View style={styles.guestAvatarContainer}>
              <View style={styles.guestAvatar}>
                <Ionicons
                  name="person-outline"
                  size={40}
                  color={colors.neutral[400]}
                />
              </View>
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>
                  {t("guest.profile.badge")}
                </Text>
              </View>
            </View>

            {/* Guest Info */}
            <Text style={styles.guestTitle}>{t("guest.profile.title")}</Text>
            <Text style={styles.guestSubtitle}>
              {t("guest.profile.subtitle")}
            </Text>

            {/* CTA Buttons */}
            <View style={styles.ctaContainer}>
              <Button
                label={t("guest.profile.createAccount")}
                onPress={handleRegister}
                variant="primary"
                size="lg"
                style={styles.primaryButton}
                icon={
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color={colors.neutral[0]}
                  />
                }
              />
              <Button
                label={t("guest.profile.login")}
                onPress={handleLogin}
                variant="outline"
                size="md"
                style={styles.secondaryButton}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionTitle}>
              {t("guest.profile.whyJoin")}
            </Text>
          </Animated.View>

          {benefits.map((benefit, index) => (
            <BenefitItem
              key={benefit.icon}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              delay={300 + index * 100}
            />
          ))}
        </View>

        {/* Stats Preview - What you're missing */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Card style={styles.statsPreviewCard}>
            <View style={styles.statsPreviewHeader}>
              <Ionicons
                name="trending-up"
                size={24}
                color={colors.primary[600]}
              />
              <Text style={styles.statsPreviewTitle}>
                {t("guest.profile.communityStats")}
              </Text>
            </View>
            <View style={styles.statsPreviewGrid}>
              <View style={styles.statsPreviewItem}>
                <Text style={styles.statsPreviewValue}>10K+</Text>
                <Text style={styles.statsPreviewLabel}>
                  {t("guest.profile.stats.members")}
                </Text>
              </View>
              <View style={styles.statsPreviewItem}>
                <Text style={styles.statsPreviewValue}>50K+</Text>
                <Text style={styles.statsPreviewLabel}>
                  {t("guest.profile.stats.exchanges")}
                </Text>
              </View>
              <View style={styles.statsPreviewItem}>
                <Text style={styles.statsPreviewValue}>4.8</Text>
                <Text style={styles.statsPreviewLabel}>
                  {t("guest.profile.stats.rating")}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Limited Menu Items */}
        <Animated.View entering={FadeInDown.delay(800)}>
          <Card style={styles.menuCard} padding="none">
            {guestMenuItems.map((item, index) => (
              <React.Fragment key={item.title}>
                <ListItem
                  title={item.title}
                  onPress={item.onPress}
                  leftIcon={
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={colors.text.secondary}
                    />
                  }
                />
                {index < guestMenuItems.length - 1 && <Divider spacing="sm" />}
              </React.Fragment>
            ))}
          </Card>
        </Animated.View>

        {/* Exit Guest Mode */}
        <Animated.View entering={FadeInDown.delay(900)}>
          <TouchableOpacity
            style={styles.exitGuestButton}
            onPress={handleExitGuest}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={colors.text.tertiary}
            />
            <Text style={styles.exitGuestText}>
              {t("guest.profile.exitGuest")}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: spacing["2xl"],
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing["2xl"],
    paddingHorizontal: spacing.base,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    alignItems: "center",
  },
  guestAvatarContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.neutral[0],
    ...shadows.md,
  },
  guestBadge: {
    position: "absolute",
    bottom: -8,
    backgroundColor: colors.warning.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  guestBadgeText: {
    ...typography.labelSmall,
    color: colors.neutral[0],
    fontWeight: "600",
  },
  guestTitle: {
    ...typography.headingLarge,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  guestSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  ctaContainer: {
    width: "100%",
    gap: spacing.sm,
  },
  primaryButton: {
    width: "100%",
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "transparent",
  },
  benefitsSection: {
    padding: spacing.base,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.headingSmall,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  benefitDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  statsPreviewCard: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  statsPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statsPreviewTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  statsPreviewGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  statsPreviewItem: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  statsPreviewValue: {
    ...typography.headingMedium,
    color: colors.primary[600],
  },
  statsPreviewLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  menuCard: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  exitGuestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginHorizontal: spacing.base,
  },
  exitGuestText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
});
