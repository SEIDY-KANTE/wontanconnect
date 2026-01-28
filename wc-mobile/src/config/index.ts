/**
 * Application Configuration
 *
 * Central configuration module that re-exports all config.
 */

export * from "./environment";

// App version info (can be updated during build)
export const APP_VERSION = "1.0.0";
export const BUILD_NUMBER = "1";

// Storage keys for secure storage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "wc_access_token",
  REFRESH_TOKEN: "wc_refresh_token",
  USER_DATA: "wc_user_data",
  DEVICE_ID: "wc_device_id",
  ONBOARDING_COMPLETE: "wc_onboarding_complete",
  LANGUAGE: "wc_language",
  THEME: "wc_theme",
} as const;

// Token configuration
export const TOKEN_CONFIG = {
  // Access token expires in 15 minutes (match backend)
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000,
  // Refresh token expires in 7 days (match backend)
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// WebSocket configuration
export const WEBSOCKET = {
  RECONNECT_INTERVAL: 3000, // 3 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 25000, // 25 seconds (server timeout is 35s)
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

// Request retry configuration
export const RETRY = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  MULTIPLIER: 2,
} as const;

// Image configuration
export const IMAGE = {
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  AVATAR_QUALITY: 0.8,
  THUMBNAIL_SIZE: 150,
  MAX_MESSAGE_IMAGES: 5,
} as const;

// Validation limits
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 100,
  MIN_DISPLAY_NAME_LENGTH: 2,
  MAX_DISPLAY_NAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  MAX_MESSAGE_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
} as const;
