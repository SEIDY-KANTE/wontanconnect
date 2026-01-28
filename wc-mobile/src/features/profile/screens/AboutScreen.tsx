/**
 * About Screen
 *
 * Displays information about WontanConnect app.
 */

import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Constants from "expo-constants";

import { ProfileScreenProps } from "@/core/navigation/types";
import { Card, Header, ListItem, Divider } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

const APP_VERSION = Constants.expoConfig?.version || "1.0.0";
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || "1";

export const AboutScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ProfileScreenProps<"About">["navigation"]>();

  const features = [
    {
      icon: "swap-horizontal" as const,
      title: t("about.features.exchange"),
      description: t("about.features.exchangeDesc"),
    },
    {
      icon: "cube-outline" as const,
      title: t("about.features.shipping"),
      description: t("about.features.shippingDesc"),
    },
    {
      icon: "shield-checkmark" as const,
      title: t("about.features.trust"),
      description: t("about.features.trustDesc"),
    },
    {
      icon: "chatbubbles" as const,
      title: t("about.features.messaging"),
      description: t("about.features.messagingDesc"),
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title={t("about.title")}
        showBack
        onBack={() => navigation.goBack()}
        variant="gradient"
        elevated
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card style={styles.headerCard}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Ionicons name="globe" size={48} color={colors.primary[600]} />
              </View>
            </View>
            <Text style={styles.appName}>WontanConnect</Text>
            <Text style={styles.tagline}>{t("about.tagline")}</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>
                {t("about.version")} {APP_VERSION}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>{t("about.whatWeDoTitle")}</Text>
          <Card style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{t("about.description")}</Text>
          </Card>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>{t("about.featuresTitle")}</Text>
          <Card style={styles.featuresCard} padding="none">
            {features.map((feature, index) => (
              <React.Fragment key={feature.title}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name={feature.icon}
                      size={24}
                      color={colors.primary[600]}
                    />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDesc}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
                {index < features.length - 1 && <Divider spacing="sm" />}
              </React.Fragment>
            ))}
          </Card>
        </Animated.View>

        {/* Trust Note */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Card style={styles.trustCard}>
            <View style={styles.trustHeader}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={colors.success.main}
              />
              <Text style={styles.trustTitle}>{t("about.trustTitle")}</Text>
            </View>
            <Text style={styles.trustText}>{t("about.trustNote")}</Text>
          </Card>
        </Animated.View>

        {/* Legal Links */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>{t("about.legalTitle")}</Text>
          <Card style={styles.legalCard} padding="none">
            <ListItem
              title={t("settings.privacy")}
              onPress={() => navigation.navigate("PrivacyPolicy")}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={colors.text.secondary}
                />
              }
            />
            <Divider spacing="sm" />
            <ListItem
              title={t("settings.terms")}
              onPress={() => navigation.navigate("TermsOfService")}
              leftIcon={
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.text.secondary}
                />
              }
            />
          </Card>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 WontanConnect. {t("about.allRightsReserved")}
          </Text>
          <Text style={styles.buildText}>Build {BUILD_NUMBER}</Text>
        </View>
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
  headerCard: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  versionBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  versionText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  sectionTitle: {
    ...typography.labelMedium,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  descriptionCard: {
    marginBottom: spacing.xl,
  },
  descriptionText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  featuresCard: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.base,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.labelMedium,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  featureDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  trustCard: {
    backgroundColor: colors.success.light,
    marginBottom: spacing.xl,
  },
  trustHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  trustTitle: {
    ...typography.labelMedium,
    color: colors.success.dark,
    marginLeft: spacing.sm,
  },
  trustText: {
    ...typography.bodySmall,
    color: colors.success.dark,
  },
  legalCard: {
    marginBottom: spacing.xl,
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xxs,
  },
  buildText: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
  },
});
