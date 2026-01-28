/**
 * API Configuration
 *
 * Central configuration for API client settings.
 * All environment-specific values should be defined here.
 */

// ============================================================================
// DATA SOURCE CONFIGURATION
// ============================================================================

/**
 * Data source mode for the application.
 * - 'api': Use live backend API (default)
 * - 'mock': Use local mock data (fallback/dev mode)
 */
export type DataSource = "api" | "mock";

/**
 * Current data source mode.
 * Can be toggled for development or fallback scenarios.
 */
export const DATA_SOURCE: DataSource = "api";

/**
 * Feature flag to enable/disable API integration.
 * When false, the app will use mock data.
 */
export const USE_API = true;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * ⚠️ IMPORTANT: For Expo Go on a physical device, set your computer's local IP here.
 * Find your IP: Windows (ipconfig) | Mac/Linux (ifconfig or ip addr)
 * Make sure your phone and computer are on the same WiFi network.
 */
const LOCAL_IP = "192.168.1.104"; // ← Your computer's local IP

/**
 * Base URL for the API.
 * In production, this should come from environment variables.
 */
export const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:3000/api/v1` // Physical device / Expo Go
  : "https://api.wontanconnect.com/api/v1";

/**
 * Alternative URLs for different development environments.
 */
export const API_URLS = {
  // Android Emulator
  androidEmulator: "http://10.0.2.2:3000/api/v1",
  // iOS Simulator
  iosSimulator: "http://localhost:3000/api/v1",
  // Physical device on same network
  localNetwork: `http://${LOCAL_IP}:3000/api/v1`,
  // Production
  production: "https://api.wontanconnect.com/api/v1",
};

// ============================================================================
// TOKEN CONFIGURATION
// ============================================================================

/**
 * Token expiration times (in milliseconds).
 * These should match the backend configuration.
 */
export const TOKEN_CONFIG = {
  // Access token expires in 15 minutes
  accessTokenExpiry: 15 * 60 * 1000,
  // Refresh token expires in 7 days
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000,
  // Refresh access token 1 minute before expiry
  refreshThreshold: 60 * 1000,
};

// ============================================================================
// REQUEST CONFIGURATION
// ============================================================================

/**
 * Request timeout in milliseconds.
 */
export const REQUEST_TIMEOUT = 30000;

/**
 * Maximum number of retry attempts for failed requests.
 */
export const MAX_RETRY_ATTEMPTS = 1;

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * Keys for storing auth tokens and user data.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "wontan_access_token",
  REFRESH_TOKEN: "wontan_refresh_token",
  USER_DATA: "wontan_user_data",
  TOKEN_EXPIRY: "wontan_token_expiry",
} as const;
