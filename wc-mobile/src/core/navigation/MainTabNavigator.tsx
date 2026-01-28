/**
 * Main Tab Navigator
 *
 * Bottom tab navigation for main app screens.
 */

import React, { useState } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

import { MainTabParamList } from "./types";
import { FXNavigator } from "./stacks/FXNavigator";
import { ShippingNavigator } from "./stacks/ShippingNavigator";
import { MessagesNavigator } from "./stacks/MessagesNavigator";
import { ProfileNavigator } from "./stacks/ProfileNavigator";
import { GuestRestrictionModal } from "@/components";
import { useIsGuest } from "@/core/store/authStore";
import { colors } from "@/design/tokens/colors";
import { typography } from "@/design/tokens/typography";
import { spacing } from "@/design/tokens/spacing";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = "swap-horizontal" | "cube" | "chatbubbles" | "person";

const tabIcons: Record<keyof MainTabParamList, TabIconName> = {
  FXTab: "swap-horizontal",
  ShippingTab: "cube",
  MessagesTab: "chatbubbles",
  ProfileTab: "person",
};

const TabIcon: React.FC<{ name: TabIconName; focused: boolean }> = ({
  name,
  focused,
}) => {
  const iconName = focused
    ? (name as keyof typeof Ionicons.glyphMap)
    : (`${name}-outline` as keyof typeof Ionicons.glyphMap);
  const iconColor = focused ? colors.primary[600] : colors.neutral[400];
  const iconSize = focused ? 24 : 22;

  if (focused) {
    return (
      <LinearGradient
        colors={gradients.brandPill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconWrapper, styles.iconWrapperActive]}
      >
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.iconWrapper}>
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isGuest = useIsGuest();
  const [showGuestModal, setShowGuestModal] = useState(false);

  const tabBarHeight =
    60 + (Platform.OS === "ios" ? insets.bottom : spacing.sm);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => {
            const iconName = tabIcons[route.name];
            return (
              <View style={styles.iconContainer}>
                <TabIcon name={iconName} focused={focused} />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            );
          },
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.neutral[400],
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: Platform.OS === "ios" ? insets.bottom : spacing.sm,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen
          name="FXTab"
          component={FXNavigator}
          options={{ tabBarLabel: t("tabs.fx") }}
        />
        <Tab.Screen
          name="ShippingTab"
          component={ShippingNavigator}
          options={{ tabBarLabel: t("tabs.shipping") }}
        />
        <Tab.Screen
          name="MessagesTab"
          component={MessagesNavigator}
          options={{ tabBarLabel: t("tabs.messages") }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                setShowGuestModal(true);
              }
            },
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileNavigator}
          options={{ tabBarLabel: t("tabs.profile") }}
        />
      </Tab.Navigator>

      <GuestRestrictionModal
        visible={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        feature={t("tabs.messages")}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
    ...shadows.sm,
  },
  tabBarLabel: {
    ...typography.captionSmall,
    fontWeight: "600",
    marginTop: 2,
  },
  tabBarItem: {
    paddingTop: spacing.xs,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconWrapper: {
    minWidth: 44,
    height: 32,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  activeIndicator: {
    position: "absolute",
    bottom: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[600],
  },
});
