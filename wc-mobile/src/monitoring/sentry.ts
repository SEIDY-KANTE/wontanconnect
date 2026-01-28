/**
 * Sentry Error Monitoring Integration
 *
 * Configures Sentry for crash reporting and error tracking.
 *
 * WHY: Production apps need visibility into crashes and errors.
 * HOW: Initialize Sentry early, log errors with context, filter sensitive data.
 * VERIFY: Trigger test error, verify it appears in Sentry dashboard.
 */

import * as Sentry from "@sentry/react-native";
import { config } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

export type SeverityLevel =
  | "fatal"
  | "error"
  | "warning"
  | "log"
  | "info"
  | "debug";

export interface ErrorContext {
  source: string;
  [key: string]: unknown;
}

export interface UserInfo {
  id: string;
  email?: string;
  name?: string;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize Sentry with production configuration
 *
 * Call this in App.tsx BEFORE any other code runs.
 */
export function initializeSentry(): void {
  const dsn = config.sentryDsn;

  // Don't initialize if no DSN configured
  if (!dsn) {
    console.warn("[Sentry] DSN not configured, skipping initialization");
    return;
  }

  // Don't initialize if crash reporting disabled
  if (!config.features.enableCrashReporting) {
    console.warn("[Sentry] Crash reporting disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: config.environment,

    // -------------------------------------------------------------------------
    // PERFORMANCE MONITORING
    // -------------------------------------------------------------------------

    // Sample rate for performance monitoring (0.0 to 1.0)
    // Lower in production to reduce costs
    tracesSampleRate: config.isDevelopment ? 1.0 : 0.2,

    // Enable performance monitoring
    enableAutoPerformanceTracing: true,

    // -------------------------------------------------------------------------
    // SESSION TRACKING
    // -------------------------------------------------------------------------

    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds

    // -------------------------------------------------------------------------
    // NATIVE CRASH HANDLING
    // -------------------------------------------------------------------------

    enableNative: true,
    enableNativeCrashHandling: true,
    enableNativeNagger: false, // Disable warnings about native SDK

    // -------------------------------------------------------------------------
    // FILTERING
    // -------------------------------------------------------------------------

    beforeSend(event, hint) {
      // Filter out sensitive data from request
      if (event.request) {
        // Remove cookies
        delete event.request.cookies;

        // Remove auth headers
        if (event.request.headers) {
          delete event.request.headers["Authorization"];
          delete event.request.headers["authorization"];
          delete event.request.headers["Cookie"];
          delete event.request.headers["cookie"];
        }
      }

      // Filter out generic network errors (they're too noisy)
      const error = hint?.originalException;
      if (error instanceof Error) {
        const message = error.message?.toLowerCase() || "";

        // Skip common network errors that aren't actionable
        if (
          message.includes("network request failed") ||
          message.includes("timeout") ||
          message.includes("aborted") ||
          message.includes("socket hang up")
        ) {
          // Log locally but don't send to Sentry
          console.warn("[Sentry] Filtered network error:", message);
          return null;
        }

        // Skip cancelled requests
        if (message.includes("cancel")) {
          return null;
        }
      }

      // Filter events from development in case DSN is set
      if (config.isDevelopment) {
        console.log(
          "[Sentry] Would send event:",
          event.exception?.values?.[0]?.value,
        );
        // Uncomment to actually send in dev for testing:
        // return event;
        return null;
      }

      return event;
    },

    // Filter breadcrumbs (automatic logs of user actions)
    beforeBreadcrumb(breadcrumb) {
      // Don't log console messages that might contain tokens
      if (breadcrumb.category === "console") {
        const message = breadcrumb.message?.toLowerCase() || "";
        if (
          message.includes("token") ||
          message.includes("password") ||
          message.includes("secret")
        ) {
          return null;
        }
      }

      // Don't log fetch requests to sensitive endpoints
      if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
        const url = breadcrumb.data?.url?.toLowerCase() || "";
        if (url.includes("/auth") || url.includes("/login")) {
          // Sanitize the breadcrumb
          return {
            ...breadcrumb,
            data: {
              ...breadcrumb.data,
              url: "[auth endpoint]",
            },
          };
        }
      }

      return breadcrumb;
    },

    // -------------------------------------------------------------------------
    // INTEGRATIONS
    // -------------------------------------------------------------------------

    integrations: [
      // React Native specific integrations are auto-configured
    ],

    // -------------------------------------------------------------------------
    // RELEASE TRACKING
    // -------------------------------------------------------------------------

    // Set from app version - update during build
    release: `wontanconnect-mobile@${process.env.APP_VERSION || "1.0.0"}`,

    // Distribution for source maps
    dist: process.env.BUILD_NUMBER || "1",
  });

  console.log("[Sentry] Initialized for environment:", config.environment);
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log an error to Sentry with context
 *
 * @param source - Where the error occurred (e.g., 'API', 'Store', 'Component')
 * @param error - The error object
 * @param extra - Additional context
 */
export function logError(
  source: string,
  error: Error | unknown,
  extra?: Record<string, unknown>,
): void {
  // Always log to console
  console.error(`[${source}]`, error);

  // Don't send to Sentry if disabled
  if (!config.features.enableCrashReporting) {
    return;
  }

  Sentry.withScope((scope) => {
    // Set error context
    scope.setContext("error_context", {
      source,
      timestamp: new Date().toISOString(),
      ...extra,
    });

    // Set tags for filtering in Sentry dashboard
    scope.setTag("source", source);

    // Capture the error
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), "error");
    }
  });
}

/**
 * Log a message to Sentry (for non-error events)
 */
export function logMessage(
  message: string,
  level: SeverityLevel = "info",
  extra?: Record<string, unknown>,
): void {
  // Log to console based on level
  const consoleMethod =
    level === "error" || level === "fatal"
      ? "error"
      : level === "warning"
        ? "warn"
        : "log";
  console[consoleMethod](`[Sentry:${level}]`, message, extra);

  // Don't send to Sentry if disabled
  if (!config.features.enableCrashReporting) {
    return;
  }

  Sentry.withScope((scope) => {
    if (extra) {
      scope.setContext("message_context", extra);
    }
    Sentry.captureMessage(message, level as Sentry.SeverityLevel);
  });
}

// ============================================================================
// USER CONTEXT
// ============================================================================

/**
 * Set the current user for error tracking
 *
 * Call this after login to associate errors with users.
 */
export function setUser(user: UserInfo): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Start a transaction for performance monitoring
 *
 * @example
 * const transaction = startTransaction('load-offers', 'ui.action');
 * // ... do work ...
 * transaction.finish();
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Add a span to the current transaction
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: SeverityLevel = "info",
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: level as Sentry.SeverityLevel,
  });
}

// ============================================================================
// CUSTOM TAGS
// ============================================================================

/**
 * Set a custom tag for filtering
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set multiple tags at once
 */
export function setTags(tags: Record<string, string>): void {
  for (const [key, value] of Object.entries(tags)) {
    Sentry.setTag(key, value);
  }
}

// ============================================================================
// REACT ERROR BOUNDARY INTEGRATION
// ============================================================================

/**
 * Wrap a component with Sentry error boundary
 * Use this for critical sections of the app.
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap a component with Sentry error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Sentry.ErrorBoundaryProps,
): React.ComponentType<P> {
  return Sentry.withErrorBoundary(Component, options || {});
}

// ============================================================================
// TESTING
// ============================================================================

/**
 * Send a test error to verify Sentry is working
 * Only works in non-production environments
 */
export function sendTestError(): void {
  if (config.isProduction) {
    console.warn("[Sentry] Cannot send test error in production");
    return;
  }

  try {
    throw new Error("Sentry Test Error - This is intentional");
  } catch (error) {
    logError("TEST", error, { intentional: true });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Sentry };
