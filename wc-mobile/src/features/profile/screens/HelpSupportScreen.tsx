import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Text,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Header, Card, Button, Toast } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

// -----------------------------------------------------------
// FAQ Accordion Item
// -----------------------------------------------------------
interface FAQItemProps {
  title: string;
  answer: string;
  index: number;
}

function FAQItem({ title, answer, index }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
    rotation.value = withTiming(expanded ? 0 : 180, { duration: 200 });
  }, [expanded, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={styles.faqItem}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqTitle}>{title}</Text>
          <Animated.View style={iconStyle}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.text.secondary}
            />
          </Animated.View>
        </View>
        {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// -----------------------------------------------------------
// Main Screen
// -----------------------------------------------------------
export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [showToast, setShowToast] = useState(false);

  // FAQ items from i18n
  const faqItems = [
    {
      key: "exchanges",
      title: t("help.faq.exchanges.title"),
      answer: t("help.faq.exchanges.answer"),
    },
    {
      key: "confirmations",
      title: t("help.faq.confirmations.title"),
      answer: t("help.faq.confirmations.answer"),
    },
    {
      key: "ratings",
      title: t("help.faq.ratings.title"),
      answer: t("help.faq.ratings.answer"),
    },
    {
      key: "safety",
      title: t("help.faq.safety.title"),
      answer: t("help.faq.safety.answer"),
    },
  ];

  const handleEmailSupport = useCallback(() => {
    const email = t("help.emailAddress");
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert("Error", "Could not open email client");
    });
  }, [t]);

  const handleReportIssue = useCallback(() => {
    // In a real app, this would open a form or feedback modal
    setShowToast(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title={t("help.title")}
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
        {/* FAQ Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>{t("help.faqTitle")}</Text>
        </Animated.View>

        <Card style={styles.faqCard} padding="none">
          {faqItems.map((item, index) => (
            <React.Fragment key={item.key}>
              <FAQItem title={item.title} answer={item.answer} index={index} />
              {index < faqItems.length - 1 && (
                <View style={styles.faqDivider} />
              )}
            </React.Fragment>
          ))}
        </Card>

        {/* Contact Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>{t("help.contactTitle")}</Text>
          <Text style={styles.sectionSubtitle}>
            {t("help.contactSubtitle")}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Card style={styles.contactCard} padding="none">
            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleEmailSupport}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t("help.email")}</Text>
                <Text style={styles.contactValue}>
                  {t("help.emailAddress")}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Card style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportIconContainer}>
                <Ionicons
                  name="warning"
                  size={24}
                  color={colors.warning.main}
                />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{t("help.reportIssue")}</Text>
                <Text style={styles.reportDesc}>
                  {t("help.reportIssueDesc")}
                </Text>
              </View>
            </View>
            <Button
              label={t("help.reportIssue")}
              variant="outline"
              size="md"
              onPress={handleReportIssue}
              style={styles.reportButton}
            />
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={showToast}
        message={t("help.reportSent")}
        type="success"
        onDismiss={() => setShowToast(false)}
      />
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.base,
  },
  sectionSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  // FAQ
  faqCard: {
    overflow: "hidden",
  },
  faqItem: {
    padding: spacing.base,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqTitle: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.xs,
    fontWeight: "600",
  },
  faqAnswer: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  faqDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.base,
  },
  // Contact
  contactCard: {
    overflow: "hidden",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  contactValue: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: "500",
  },
  // Report
  reportCard: {
    marginTop: spacing.md,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.base,
  },
  reportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.warning.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: "600",
    marginBottom: spacing.xxs,
  },
  reportDesc: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  reportButton: {
    alignSelf: "flex-start",
  },
});
