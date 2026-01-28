/**
 * Exchange Session Types
 *
 * Core data models for the exchange/trust system.
 * Exchange Sessions represent real exchange attempts between two users.
 */

import { User } from "@/features/fx/model/types";

// ============================================================================
// EXCHANGE SESSION TYPES
// ============================================================================

/**
 * Type of exchange session
 */
export type ExchangeType = "FX" | "SHIPPING";

/**
 * FX Exchange Session statuses
 */
export type FXExchangeStatus =
  | "PENDING_APPROVAL" // Taker sent request, awaiting owner approval
  | "IN_PROGRESS" // Owner approved, exchange ongoing
  | "COMPLETED" // Both parties confirmed
  | "CANCELLED"; // Declined or cancelled by either party

/**
 * Shipping Exchange Session statuses (extended)
 */
export type ShippingExchangeStatus =
  | "PENDING_APPROVAL" // Taker sent request
  | "IN_PROGRESS" // Owner approved
  | "IN_TRANSIT" // Sender marked as sent
  | "DELIVERED_PENDING_CONFIRMATION" // Receiver needs to confirm
  | "COMPLETED" // Both confirmed
  | "CANCELLED"; // Cancelled

/**
 * Combined exchange status type
 */
export type ExchangeStatus = FXExchangeStatus | ShippingExchangeStatus;

/**
 * Confirmation state for an exchange
 */
export interface ExchangeConfirmations {
  initiatorConfirmed: boolean; // Offer owner confirmed (sent money/parcel)
  takerConfirmed: boolean; // Offer taker confirmed (received)
  initiatorConfirmedAt?: string;
  takerConfirmedAt?: string;
}

/**
 * Agreed amount for FX exchange
 */
export interface FXAgreedAmount {
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  isFullAmount: boolean;
}

/**
 * Agreed amount for Shipping exchange
 */
export interface ShippingAgreedAmount {
  description: string;
  weight?: string;
  price?: string;
}

/**
 * Exchange Session - Core model
 */
export interface ExchangeSession {
  id: string;
  type: ExchangeType;
  offerId: string;
  initiatorUserId: string; // Offer owner
  takerUserId: string; // Who clicked "Take offer"
  initiator: User;
  taker: User;
  agreedAmount: FXAgreedAmount | ShippingAgreedAmount;
  status: ExchangeStatus;
  confirmations: ExchangeConfirmations;
  conversationId?: string; // Linked conversation (created when session is accepted)
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

/**
 * FX Exchange Session (typed version)
 */
export interface FXExchangeSession extends ExchangeSession {
  type: "FX";
  agreedAmount: FXAgreedAmount;
  status: FXExchangeStatus;
}

/**
 * Shipping Exchange Session (typed version)
 */
export interface ShippingExchangeSession extends ExchangeSession {
  type: "SHIPPING";
  agreedAmount: ShippingAgreedAmount;
  status: ShippingExchangeStatus;
}

// ============================================================================
// RATING TYPES
// ============================================================================

/**
 * Rating for an exchange
 */
export interface ExchangeRating {
  id: string;
  exchangeId: string;
  fromUserId: string; // Who gave the rating
  toUserId: string; // Who received the rating
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: string;
}

/**
 * User trust profile (computed from ratings)
 */
export interface UserTrustProfile {
  userId: string;
  totalExchanges: number;
  completedExchanges: number;
  averageRating: number;
  totalRatings: number;
  trustBadge: TrustBadge;
}

/**
 * Trust badge levels
 */
export type TrustBadge =
  | "NEW" // < 3 completed exchanges
  | "VERIFIED" // 3-10 exchanges, rating >= 4.0
  | "TRUSTED" // 10-25 exchanges, rating >= 4.5
  | "TOP_TRADER"; // 25+ exchanges, rating >= 4.8

// ============================================================================
// OFFER EXTENSION TYPES
// ============================================================================

/**
 * Extended FX Offer status for partial fills
 */
export type ExtendedFXOfferStatus =
  | "OPEN" // Available for taking
  | "PARTIALLY_FILLED" // Some amount taken
  | "FILLED" // Fully taken
  | "completed" // Legacy status (kept for compatibility)
  | "cancelled" // Legacy status
  | "active"; // Legacy status

/**
 * Extended Shipping Offer status
 */
export type ExtendedShippingOfferStatus =
  | "OPEN"
  | "RESERVED"
  | "FILLED"
  | "completed"
  | "cancelled"
  | "active";

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

/**
 * Take offer form data
 */
export interface TakeOfferFormData {
  isFullAmount: boolean;
  customFromAmount?: number;
  customToAmount?: number;
}

/**
 * Rating form data
 */
export interface RatingFormData {
  rating: number;
  comment?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if exchange is FX type
 */
export const isFXExchange = (
  exchange: ExchangeSession,
): exchange is FXExchangeSession => {
  return exchange.type === "FX";
};

/**
 * Check if exchange is Shipping type
 */
export const isShippingExchange = (
  exchange: ExchangeSession,
): exchange is ShippingExchangeSession => {
  return exchange.type === "SHIPPING";
};

/**
 * Check if exchange is completed
 */
export const isExchangeCompleted = (exchange: ExchangeSession): boolean => {
  return exchange.status === "COMPLETED";
};

/**
 * Check if exchange is active (not cancelled or completed)
 */
export const isExchangeActive = (exchange: ExchangeSession): boolean => {
  return exchange.status !== "COMPLETED" && exchange.status !== "CANCELLED";
};

/**
 * Check if user can confirm (hasn't already confirmed)
 */
export const canUserConfirm = (
  exchange: ExchangeSession,
  userId: string,
): boolean => {
  if (exchange.status === "COMPLETED" || exchange.status === "CANCELLED") {
    return false;
  }

  if (userId === exchange.initiatorUserId) {
    return !exchange.confirmations.initiatorConfirmed;
  }

  if (userId === exchange.takerUserId) {
    return !exchange.confirmations.takerConfirmed;
  }

  return false;
};

/**
 * Calculate trust badge based on user stats
 */
export const calculateTrustBadge = (
  completedExchanges: number,
  averageRating: number,
): TrustBadge => {
  if (completedExchanges >= 25 && averageRating >= 4.8) {
    return "TOP_TRADER";
  }
  if (completedExchanges >= 10 && averageRating >= 4.5) {
    return "TRUSTED";
  }
  if (completedExchanges >= 3 && averageRating >= 4.0) {
    return "VERIFIED";
  }
  return "NEW";
};

/**
 * Get status info for display (color, icon, translation key)
 */
export const getStatusInfo = (
  exchange: ExchangeSession,
): {
  key: string;
  color: string;
  icon: string;
} => {
  const statusMap: Record<
    ExchangeStatus,
    { key: string; color: string; icon: string }
  > = {
    PENDING_APPROVAL: {
      key: "pending_approval",
      color: "#F59E0B", // warning
      icon: "time-outline",
    },
    IN_PROGRESS: {
      key: "in_progress",
      color: "#3B82F6", // info
      icon: "swap-horizontal",
    },
    IN_TRANSIT: {
      key: "in_transit",
      color: "#8B5CF6", // purple
      icon: "airplane",
    },
    DELIVERED_PENDING_CONFIRMATION: {
      key: "delivered_pending",
      color: "#10B981", // success light
      icon: "cube",
    },
    COMPLETED: {
      key: "completed",
      color: "#059669", // success
      icon: "checkmark-done-circle",
    },
    CANCELLED: {
      key: "cancelled",
      color: "#EF4444", // error
      icon: "close-circle",
    },
  };

  return statusMap[exchange.status] || statusMap.PENDING_APPROVAL;
};
