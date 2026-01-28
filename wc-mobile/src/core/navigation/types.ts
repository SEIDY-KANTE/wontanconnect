/**
 * Navigation Types
 *
 * Type definitions for all navigation stacks.
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";

// Root Stack
export type RootStackParamList = {
  BrandIntro: undefined;
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator
export type MainTabParamList = {
  FXTab: NavigatorScreenParams<FXStackParamList>;
  ShippingTab: NavigatorScreenParams<ShippingStackParamList>;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// FX Exchange Stack
export type FXStackParamList = {
  FXList: undefined;
  FXDetail: { offerId: string };
  FXCreate: { offerId?: string } | undefined;
};

// Shipping Stack
export type ShippingStackParamList = {
  ShippingList: undefined;
  ShippingDetail: { offerId: string };
  ShippingCreate: { offerId?: string } | undefined;
};

// Messages Stack
export type MessagesStackParamList = {
  Inbox: undefined;
  Chat: { conversationId: string; recipientName: string; exchangeId?: string };
  ExchangeDetail: { exchangeId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  MyFXOffers: undefined;
  MyShippingOffers: undefined;
  EditProfile: undefined;
  MyFXExchanges: undefined;
  MyShippingExchanges: undefined;
  ExchangeDetail: { exchangeId: string };
  Notifications: undefined;
  HelpSupport: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Screen props helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type FXScreenProps<T extends keyof FXStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<FXStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, "FXTab">,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type ShippingScreenProps<T extends keyof ShippingStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ShippingStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, "ShippingTab">,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type MessagesScreenProps<T extends keyof MessagesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MessagesStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, "MessagesTab">,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, "ProfileTab">,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// Declare global navigation
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
