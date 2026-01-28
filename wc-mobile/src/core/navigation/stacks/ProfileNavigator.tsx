/**
 * Profile Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfileStackParamList } from "../types";
import { ProfileScreen } from "@/features/profile/screens/ProfileScreen";
import { SettingsScreen } from "@/features/profile/screens/SettingsScreen";
import { MyFXOffersScreen } from "@/features/profile/screens/MyFXOffersScreen";
import { MyShippingOffersScreen } from "@/features/profile/screens/MyShippingOffersScreen";
import { EditProfileScreen } from "@/features/profile/screens/EditProfileScreen";
import { MyFXExchangesScreen } from "@/features/exchange/screens/MyFXExchangesScreen";
import { MyShippingExchangesScreen } from "@/features/exchange/screens/MyShippingExchangesScreen";
import { ExchangeDetailScreen } from "@/features/exchange/screens/ExchangeDetailScreen";
import { NotificationsScreen } from "@/features/profile/screens/NotificationsScreen";
import { AboutScreen } from "@/features/profile/screens/AboutScreen";
import HelpSupportScreen from "@/features/profile/screens/HelpSupportScreen";
import PrivacyPolicyScreen from "@/features/profile/screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "@/features/profile/screens/TermsOfServiceScreen";
import { colors } from "@/design/tokens/colors";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="MyFXOffers" component={MyFXOffersScreen} />
      <Stack.Screen
        name="MyShippingOffers"
        component={MyShippingOffersScreen}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyFXExchanges" component={MyFXExchangesScreen} />
      <Stack.Screen
        name="MyShippingExchanges"
        component={MyShippingExchangesScreen}
      />
      <Stack.Screen name="ExchangeDetail" component={ExchangeDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
};
