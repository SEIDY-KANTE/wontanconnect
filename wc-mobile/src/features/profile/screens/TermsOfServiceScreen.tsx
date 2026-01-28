import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Header, Card } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------
interface TermsSection {
  key: string;
  titleKey: string;
  contentKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------
const SECTIONS: TermsSection[] = [
  {
    key: "intro",
    titleKey: "intro.title",
    contentKey: "intro.content",
    icon: "document",
  },
  {
    key: "services",
    titleKey: "services.title",
    contentKey: "services.content",
    icon: "apps",
  },
  {
    key: "responsibilities",
    titleKey: "responsibilities.title",
    contentKey: "responsibilities.content",
    icon: "person-circle",
  },
  {
    key: "prohibited",
    titleKey: "prohibited.title",
    contentKey: "prohibited.content",
    icon: "close-circle",
  },
  {
    key: "disclaimer",
    titleKey: "disclaimer.title",
    contentKey: "disclaimer.content",
    icon: "alert-circle",
  },
  {
    key: "contact",
    titleKey: "contact.title",
    contentKey: "contact.content",
    icon: "mail",
  },
];

// -----------------------------------------------------------
// Main Screen
// -----------------------------------------------------------
export default function TermsOfServiceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title={t("terms.title")}
        showBack
        onBack={() => navigation.goBack()}
        variant="gradient"
        elevated
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Draft Notice */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.draftBanner}>
            <Ionicons name="construct" size={18} color={colors.warning.dark} />
            <Text style={styles.draftText}>{t("terms.draftNotice")}</Text>
          </View>
        </Animated.View>

        {/* Last Updated */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.lastUpdated}>{t("terms.lastUpdated")}</Text>
        </Animated.View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <Animated.View
            key={section.key}
            entering={FadeInDown.delay(250 + index * 80).duration(400)}
          >
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    section.key === "prohibited" && styles.iconContainerWarning,
                    section.key === "disclaimer" && styles.iconContainerNeutral,
                  ]}
                >
                  <Ionicons
                    name={section.icon}
                    size={22}
                    color={
                      section.key === "prohibited"
                        ? colors.error.main
                        : section.key === "disclaimer"
                          ? colors.warning.main
                          : colors.primary[600]
                    }
                  />
                </View>
                <Text style={styles.sectionTitle}>
                  {t(`terms.sections.${section.titleKey}`)}
                </Text>
              </View>
              <Text style={styles.sectionContent}>
                {t(`terms.sections.${section.contentKey}`)}
              </Text>
            </Card>
          </Animated.View>
        ))}

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <Text style={styles.footer}>
            © {new Date().getFullYear()} WontanConnect
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing["4xl"],
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning.light,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  draftText: {
    ...typography.bodyMedium,
    color: colors.warning.dark,
    fontWeight: "600",
  },
  lastUpdated: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: "center",
    marginBottom: spacing.base,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconContainerWarning: {
    backgroundColor: colors.error.light,
  },
  iconContainerNeutral: {
    backgroundColor: colors.warning.light,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    flex: 1,
  },
  sectionContent: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: spacing.base,
  },
});
