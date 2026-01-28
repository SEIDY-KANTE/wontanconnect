/**
 * Analytics Service
 *
 * Centralized analytics tracking for user behavior and business metrics.
 *
 * WHY: Need visibility into user behavior for product decisions.
 * HOW: Instrument key events, track funnels, respect privacy.
 * VERIFY: Test events fire correctly, check analytics dashboard.
 */

import * as Analytics from "expo-firebase-analytics";
import { config } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

export interface EventProperties {
  [key: string]: string | number | boolean | undefined | null;
}

export interface UserProperties {
  userId?: string;
  trustLevel?: string;
  preferredCurrency?: string;
  accountAge?: number;
  completedExchanges?: number;
  platform?: "ios" | "android";
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
  private enabled: boolean;
  private userId: string | null = null;
  private sessionStartTime: number = Date.now();

  constructor() {
    this.enabled = config.features.enableAnalytics;
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------------------

  /**
   * Initialize analytics (call early in app lifecycle)
   */
  async initialize(): Promise<void> {
    if (!this.enabled) {
      console.log("[Analytics] Disabled by config");
      return;
    }

    try {
      // Set analytics collection based on environment
      await Analytics.setAnalyticsCollectionEnabled(this.enabled);

      this.sessionStartTime = Date.now();
      console.log("[Analytics] Initialized");
    } catch (error) {
      console.error("[Analytics] Failed to initialize:", error);
    }
  }

  /**
   * Enable or disable analytics (for user preference)
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await Analytics.setAnalyticsCollectionEnabled(enabled);
  }

  // -------------------------------------------------------------------------
  // USER IDENTIFICATION
  // -------------------------------------------------------------------------

  /**
   * Set user ID for event attribution
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.enabled) return;

    this.userId = userId;
    await Analytics.setUserId(userId);
  }

  /**
   * Clear user ID (on logout)
   */
  async clearUserId(): Promise<void> {
    this.userId = null;
    await Analytics.setUserId(null);
  }

  /**
   * Set user properties for segmentation
   */
  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.enabled) return;

    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined && value !== null) {
        await Analytics.setUserProperty(key, String(value));
      }
    }
  }

  // -------------------------------------------------------------------------
  // GENERIC EVENT TRACKING
  // -------------------------------------------------------------------------

  /**
   * Track a custom event
   */
  async trackEvent(
    eventName: string,
    properties?: EventProperties,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      // Clean properties (remove undefined/null)
      const cleanedProps: Record<string, string | number | boolean> = {};
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if (value !== undefined && value !== null) {
            cleanedProps[key] = value;
          }
        }
      }

      await Analytics.logEvent(eventName, cleanedProps);

      if (config.isDevelopment) {
        console.log("[Analytics] Event:", eventName, cleanedProps);
      }
    } catch (error) {
      console.error("[Analytics] Failed to track event:", error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreen(screenName: string, screenClass?: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await Analytics.logEvent("screen_view", {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      if (config.isDevelopment) {
        console.log("[Analytics] Screen:", screenName);
      }
    } catch (error) {
      console.error("[Analytics] Failed to track screen:", error);
    }
  }

  // -------------------------------------------------------------------------
  // BUSINESS EVENTS
  // -------------------------------------------------------------------------

  // AUTHENTICATION

  async trackSignUp(method: "email" | "google" | "apple"): Promise<void> {
    await this.trackEvent("sign_up", { method });
  }

  async trackLogin(method: "email" | "google" | "apple"): Promise<void> {
    await this.trackEvent("login", { method });
  }

  async trackLogout(): Promise<void> {
    await this.trackEvent("logout", {
      session_duration: Date.now() - this.sessionStartTime,
    });
  }

  // OFFERS

  async trackOfferViewed(
    offerId: string,
    offerType: "fx" | "shipping",
    currency?: string,
  ): Promise<void> {
    await this.trackEvent("offer_viewed", {
      offer_id: offerId,
      offer_type: offerType,
      currency,
    });
  }

  async trackOfferCreated(
    offerId: string,
    offerType: "fx" | "shipping",
    amount?: number,
    currency?: string,
  ): Promise<void> {
    await this.trackEvent("offer_created", {
      offer_id: offerId,
      offer_type: offerType,
      amount,
      currency,
    });
  }

  async trackOfferDeleted(
    offerId: string,
    offerType: "fx" | "shipping",
  ): Promise<void> {
    await this.trackEvent("offer_deleted", {
      offer_id: offerId,
      offer_type: offerType,
    });
  }

  // SESSIONS (EXCHANGES)

  async trackSessionCreated(
    sessionId: string,
    offerId: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    await this.trackEvent("session_created", {
      session_id: sessionId,
      offer_id: offerId,
      amount,
      currency,
    });
  }

  async trackSessionAccepted(sessionId: string): Promise<void> {
    await this.trackEvent("session_accepted", {
      session_id: sessionId,
    });
  }

  async trackSessionRejected(
    sessionId: string,
    reason?: string,
  ): Promise<void> {
    await this.trackEvent("session_rejected", {
      session_id: sessionId,
      reason,
    });
  }

  async trackSessionConfirmed(sessionId: string): Promise<void> {
    await this.trackEvent("session_confirmed", {
      session_id: sessionId,
    });
  }

  async trackSessionCompleted(
    sessionId: string,
    amount: number,
    currency: string,
    duration: number, // ms from creation to completion
  ): Promise<void> {
    await this.trackEvent("session_completed", {
      session_id: sessionId,
      amount,
      currency,
      duration_hours: Math.round(duration / (1000 * 60 * 60)),
    });
  }

  async trackSessionDisputed(
    sessionId: string,
    reason?: string,
  ): Promise<void> {
    await this.trackEvent("session_disputed", {
      session_id: sessionId,
      reason,
    });
  }

  async trackSessionCancelled(
    sessionId: string,
    cancelledBy: "initiator" | "responder",
    reason?: string,
  ): Promise<void> {
    await this.trackEvent("session_cancelled", {
      session_id: sessionId,
      cancelled_by: cancelledBy,
      reason,
    });
  }

  // MESSAGING

  async trackMessageSent(
    conversationId: string,
    hasAttachment: boolean,
  ): Promise<void> {
    await this.trackEvent("message_sent", {
      conversation_id: conversationId,
      has_attachment: hasAttachment,
    });
  }

  async trackConversationOpened(conversationId: string): Promise<void> {
    await this.trackEvent("conversation_opened", {
      conversation_id: conversationId,
    });
  }

  // RATINGS

  async trackRatingSubmitted(
    sessionId: string,
    score: number,
    hasComment: boolean,
  ): Promise<void> {
    await this.trackEvent("rating_submitted", {
      session_id: sessionId,
      score,
      has_comment: hasComment,
    });
  }

  // SEARCH & FILTERS

  async trackSearch(
    searchType: "fx" | "shipping",
    query?: string,
    filters?: Record<string, unknown>,
  ): Promise<void> {
    await this.trackEvent("search", {
      search_type: searchType,
      has_query: !!query,
      filter_count: filters ? Object.keys(filters).length : 0,
    });
  }

  async trackFilterApplied(
    filterName: string,
    filterValue: string,
  ): Promise<void> {
    await this.trackEvent("filter_applied", {
      filter_name: filterName,
      filter_value: filterValue,
    });
  }

  // ERRORS

  async trackError(
    errorType: string,
    errorMessage: string,
    context?: string,
  ): Promise<void> {
    await this.trackEvent("app_error", {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Truncate
      context,
    });
  }

  // -------------------------------------------------------------------------
  // FUNNEL TRACKING
  // -------------------------------------------------------------------------

  /**
   * Track progress through the exchange funnel
   */
  async trackFunnelStep(
    funnel: "fx_exchange" | "shipping_exchange",
    step: "view_offer" | "start_session" | "confirm" | "complete",
    offerId?: string,
  ): Promise<void> {
    await this.trackEvent("funnel_step", {
      funnel,
      step,
      offer_id: offerId,
    });
  }

  // -------------------------------------------------------------------------
  // TIMING EVENTS
  // -------------------------------------------------------------------------

  /**
   * Track time spent on a screen or action
   */
  async trackTiming(
    category: string,
    name: string,
    durationMs: number,
  ): Promise<void> {
    await this.trackEvent("timing", {
      category,
      name,
      duration_ms: durationMs,
      duration_seconds: Math.round(durationMs / 1000),
    });
  }

  // -------------------------------------------------------------------------
  // ENGAGEMENT METRICS
  // -------------------------------------------------------------------------

  /**
   * Track app foreground (resumed)
   */
  async trackAppForegrounded(): Promise<void> {
    await this.trackEvent("app_foregrounded");
  }

  /**
   * Track app background (paused)
   */
  async trackAppBackgrounded(sessionDuration: number): Promise<void> {
    await this.trackEvent("app_backgrounded", {
      session_duration_ms: sessionDuration,
    });
  }

  /**
   * Track notification interaction
   */
  async trackNotificationOpened(
    notificationType: string,
    notificationId?: string,
  ): Promise<void> {
    await this.trackEvent("notification_opened", {
      notification_type: notificationType,
      notification_id: notificationId,
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const analytics = new AnalyticsService();

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useRef } from "react";

/**
 * Hook to track screen views automatically
 */
export function useScreenTracking(screenName: string): void {
  useEffect(() => {
    analytics.trackScreen(screenName);
  }, [screenName]);
}

/**
 * Hook to track time spent on a screen
 */
export function useScreenTiming(screenName: string): void {
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const duration = Date.now() - startTime.current;
      analytics.trackTiming("screen", screenName, duration);
    };
  }, [screenName]);
}
