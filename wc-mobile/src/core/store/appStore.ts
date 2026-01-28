/**
 * App Store (Zustand)
 *
 * Global application state management.
 *
 * Why Zustand over Redux Toolkit:
 * - Minimal boilerplate for MVP
 * - Simple API with TypeScript inference
 * - No providers needed (less wrapper components)
 * - Easy integration with React Native
 * - Straightforward async actions
 * - Built-in persistence support
 *
 * Can migrate to Redux Toolkit later if needed for complex state requirements.
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "fr" | "tr";

interface ToastState {
  visible: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface AppState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;

  // Brand Intro
  hasSeenIntro: boolean;
  markIntroAsSeen: () => Promise<void>;

  // Onboarding
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;

  // Auth
  hasCompletedAuth: boolean;
  completeAuth: () => Promise<void>;
  logout: () => Promise<void>;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Toast notifications
  toast: ToastState | null;
  showToast: (type: ToastState["type"], message: string) => void;
  hideToast: () => void;

  // Persistence
  loadPersistedState: () => Promise<void>;
}

const STORAGE_KEYS = {
  LANGUAGE: "@wontan/language",
  INTRO_SEEN: "@wontan/intro_seen",
  ONBOARDING_COMPLETE: "@wontan/onboarding_complete",
  AUTH_COMPLETE: "@wontan/auth_complete",
} as const;

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  language: "fr",
  hasSeenIntro: false,
  hasCompletedOnboarding: false,
  hasCompletedAuth: false,
  isLoading: false,
  toast: null,

  // Language
  setLanguage: async (lang: Language) => {
    set({ language: lang });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  },

  // Brand Intro
  markIntroAsSeen: async () => {
    set({ hasSeenIntro: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INTRO_SEEN, "true");
    } catch (error) {
      console.error("Error saving intro state:", error);
    }
  },

  // Onboarding
  completeOnboarding: async () => {
    set({ hasCompletedOnboarding: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  },

  // Auth
  completeAuth: async () => {
    set({ hasCompletedAuth: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_COMPLETE, "true");
    } catch (error) {
      console.error("Error saving auth state:", error);
    }
  },

  logout: async () => {
    set({ hasCompletedAuth: false });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_COMPLETE);
    } catch (error) {
      console.error("Error clearing auth state:", error);
    }
  },

  // Loading
  setIsLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Toast
  showToast: (type: ToastState["type"], message: string) => {
    set({ toast: { visible: true, type, message } });
  },

  hideToast: () => {
    set({ toast: null });
  },

  // Load persisted state on app start
  loadPersistedState: async () => {
    try {
      const [language, introSeen, onboardingComplete, authComplete] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.INTRO_SEEN),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_COMPLETE),
        ]);

      set({
        language: (language as Language) || "fr",
        hasSeenIntro: introSeen === "true",
        hasCompletedOnboarding: onboardingComplete === "true",
        hasCompletedAuth: authComplete === "true",
      });
    } catch (error) {
      console.error("Error loading persisted state:", error);
    }
  },
}));
