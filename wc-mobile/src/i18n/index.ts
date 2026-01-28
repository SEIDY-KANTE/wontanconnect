/**
 * i18n Configuration
 *
 * Multi-language support with react-i18next.
 * Default language: English (global platform)
 * Available: English, French, Turkish
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import tr from "./locales/tr.json";

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  tr: { translation: tr },
} as const;

export const supportedLanguages = ["en", "fr", "tr"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Default language for global audience
  fallbackLng: "en",
  compatibilityJSON: "v3", // Use v3 format for React Native compatibility (no Intl.PluralRules needed)
  interpolation: {
    escapeValue: false, // React already handles escaping
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

// Helper to change language (also updates store)
export const changeLanguage = async (lang: SupportedLanguage) => {
  await i18n.changeLanguage(lang);
};
