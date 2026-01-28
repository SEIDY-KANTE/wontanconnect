/**
 * Settings Screen
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
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ProfileScreenProps } from "@/core/navigation/types";
import { useAppStore, Language } from "@/core/store/appStore";
import { changeLanguage } from "@/i18n";
import { Card, ListItem, Divider, Header } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";

const APP_VERSION = "1.0.0";

export const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ProfileScreenProps<"Settings">["navigation"]>();
  const { language, setLanguage } = useAppStore();

  const handleLanguageChange = async (newLang: Language) => {
    await setLanguage(newLang);
    await changeLanguage(newLang);
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "en", label: t("settings.languages.en"), flag: "🇬🇧" },
    { code: "fr", label: t("settings.languages.fr"), flag: "🇫🇷" },
    { code: "tr", label: t("settings.languages.tr"), flag: "🇹🇷" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title={t("settings.title")}
        showBack
        onBack={() => navigation.goBack()}
        variant="gradient"
        elevated
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Selection */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
          <Card style={styles.card} padding="none">
            {languages.map((lang, index) => (
              <React.Fragment key={lang.code}>
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={styles.languageLabel}>{lang.label}</Text>
                  </View>
                  {language === lang.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.primary[600]}
                    />
                  )}
                </TouchableOpacity>
                {index < languages.length - 1 && <Divider spacing="sm" />}
              </React.Fragment>
            ))}
          </Card>
        </Animated.View>

        {/* Other Settings */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>{t("common.optional")}</Text>
          <Card style={styles.card} padding="none">
            <ListItem
              title={t("settings.notifications")}
              leftIcon={
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={colors.text.secondary}
                />
              }
              onPress={() => navigation.navigate("Notifications")}
            />
            <Divider spacing="sm" />
            <ListItem
              title={t("settings.privacy")}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={colors.text.secondary}
                />
              }
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
            <Divider spacing="sm" />
            <ListItem
              title={t("settings.terms")}
              leftIcon={
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.text.secondary}
                />
              }
              onPress={() => navigation.navigate("TermsOfService")}
            />
          </Card>
        </Animated.View>

        {/* App Version */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.versionContainer}>
            <Text style={styles.versionLabel}>{t("settings.version")}</Text>
            <Text style={styles.versionValue}>{APP_VERSION}</Text>
          </View>
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
  sectionTitle: {
    ...typography.labelMedium,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    marginBottom: spacing.xl,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  versionLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  versionValue: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
});
