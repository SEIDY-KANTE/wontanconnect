/**
 * Environment Configuration
 *
 * Centralized environment configuration for:
 * - Development (local backend)
 * - Staging (test server)
 * - Production (live server)
 *
 * Features:
 * - Type-safe configuration
 * - Runtime environment detection
 * - Feature flags per environment
 */

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

export type Environment = "development" | "staging" | "production";

export interface EnvironmentConfig {
  // Environment identifier
  name: Environment;

  // API Configuration
  apiBaseUrl: string;
  wsBaseUrl: string;
  apiTimeout: number;

  // Feature Flags
  features: {
    enableMockFallback: boolean; // NEVER true in production!
    enableDebugLogs: boolean;
    enableCrashReporting: boolean;
    enableAnalytics: boolean;
    enablePushNotifications: boolean;
    // Missing backend endpoints - disable until implemented
    enablePasswordReset: boolean;
    enableEmailVerification: boolean;
  };

  // Monitoring
  sentryDsn: string | null;
  analyticsKey: string | null;

  // Security
  tokenRefreshThreshold: number; // ms before expiry to refresh

  // Development
  localIp?: string;
}

// ============================================================================
// ENVIRONMENT CONFIGURATIONS
// ============================================================================

/**
 * ⚠️ IMPORTANT: Update LOCAL_IP to your computer's IP for physical device testing
 * Find your IP: Windows (ipconfig) | Mac/Linux (ifconfig or ip addr)
 */
const LOCAL_IP = "192.168.1.103";

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    name: "development",
    apiBaseUrl: `http://${LOCAL_IP}:3000/api/v1`,
    wsBaseUrl: `ws://${LOCAL_IP}:3000/ws`,
    apiTimeout: 30000,
    features: {
      enableMockFallback: false, // Even in dev, train for real error handling
      enableDebugLogs: true,
      enableCrashReporting: false,
      enableAnalytics: false,
      enablePushNotifications: false,
      enablePasswordReset: false, // Backend not implemented yet
      enableEmailVerification: false, // Backend not implemented yet
    },
    sentryDsn: null,
    analyticsKey: null,
    tokenRefreshThreshold: 60 * 1000, // 1 minute
    localIp: LOCAL_IP,
  },

  staging: {
    name: "staging",
    apiBaseUrl: "https://staging-api.wontanconnect.com/api/v1",
    wsBaseUrl: "wss://staging-api.wontanconnect.com/ws",
    apiTimeout: 30000,
    features: {
      enableMockFallback: false,
      enableDebugLogs: true,
      enableCrashReporting: true,
      enableAnalytics: true,
      enablePushNotifications: true,
      enablePasswordReset: false, // Backend not implemented yet
      enableEmailVerification: false, // Backend not implemented yet
    },
    sentryDsn: process.env.SENTRY_DSN_STAGING ?? null,
    analyticsKey: process.env.ANALYTICS_KEY_STAGING ?? null,
    tokenRefreshThreshold: 60 * 1000,
  },

  production: {
    name: "production",
    apiBaseUrl: "https://api.wontanconnect.com/api/v1",
    wsBaseUrl: "wss://api.wontanconnect.com/ws",
    apiTimeout: 30000,
    features: {
      enableMockFallback: false, // NEVER enable in production!
      enableDebugLogs: false,
      enableCrashReporting: true,
      enableAnalytics: true,
      enablePushNotifications: true,
      enablePasswordReset: false, // Enable when backend implements
      enableEmailVerification: false, // Enable when backend implements
    },
    sentryDsn: process.env.SENTRY_DSN_PROD ?? null,
    analyticsKey: process.env.ANALYTICS_KEY_PROD ?? null,
    tokenRefreshThreshold: 2 * 60 * 1000, // 2 minutes for safety
  },
};

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Determines the current environment.
 *
 * Priority:
 * 1. Explicit APP_ENV environment variable
 * 2. __DEV__ flag for development
 * 3. Default to production for safety
 */
function detectEnvironment(): Environment {
  // Check for explicit environment variable
  const envVar = process.env.APP_ENV as Environment | undefined;
  if (envVar && environments[envVar]) {
    return envVar;
  }

  // Use __DEV__ flag (set by React Native)
  if (__DEV__) {
    return "development";
  }

  // Default to production for safety
  return "production";
}

// ============================================================================
// CURRENT CONFIGURATION
// ============================================================================

const currentEnvironment = detectEnvironment();

/**
 * Current environment configuration.
 * Use this throughout the app for all environment-specific values.
 */
export const config = environments[currentEnvironment];

/**
 * Check if running in development mode
 */
export const isDevelopment = config.name === "development";

/**
 * Check if running in staging mode
 */
export const isStaging = config.name === "staging";

/**
 * Check if running in production mode
 */
export const isProduction = config.name === "production";

// ============================================================================
// ALTERNATIVE API URLS (for development flexibility)
// ============================================================================

/**
 * Alternative URLs for different development scenarios
 */
export const alternativeUrls = {
  // Android Emulator
  androidEmulator: {
    api: "http://10.0.2.2:3000/api/v1",
    ws: "ws://10.0.2.2:3000/ws",
  },
  // iOS Simulator
  iosSimulator: {
    api: "http://localhost:3000/api/v1",
    ws: "ws://localhost:3000/ws",
  },
  // Physical device on same network
  localNetwork: {
    api: `http://${LOCAL_IP}:3000/api/v1`,
    ws: `ws://${LOCAL_IP}:3000/ws`,
  },
};

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log only in development/staging with debug logs enabled
 */
export function debugLog(context: string, ...args: unknown[]): void {
  if (config.features.enableDebugLogs) {
    console.log(`[${context}]`, ...args);
  }
}

/**
 * Log warnings (always logged except in production without debug)
 */
export function warnLog(context: string, ...args: unknown[]): void {
  if (config.features.enableDebugLogs || !isProduction) {
    console.warn(`[${context}]`, ...args);
  }
}

/**
 * Log errors (always logged)
 */
export function errorLog(
  context: string,
  error: unknown,
  ...args: unknown[]
): void {
  console.error(`[${context}]`, error, ...args);

  // In production, also report to crash reporting service
  if (config.features.enableCrashReporting && config.sentryDsn) {
    // This will be integrated with Sentry
    // Sentry.captureException(error, { extra: { context, ...args } });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { environments, currentEnvironment };

// Type-safe environment access
export type { Environment, EnvironmentConfig };
