/**
 * Exchange Hooks
 *
 * Reusable hooks for exchange session management.
 */

import { useCallback, useMemo, useState, useEffect } from "react";
import { useExchangeStore, CURRENT_USER_ID } from "../store/exchangeStore";
import {
  ExchangeSession,
  FXAgreedAmount,
  ShippingAgreedAmount,
  canUserConfirm,
  isExchangeActive,
  isExchangeCompleted,
} from "../model/types";
import { User } from "@/features/fx/model/types";

// ============================================================================
// useExchangeSession
// ============================================================================

interface UseExchangeSessionReturn {
  session: ExchangeSession | undefined;
  isLoading: boolean;
  isInitiator: boolean;
  isTaker: boolean;
  partner: User | null;
  canConfirm: boolean;
  hasConfirmed: boolean;
  partnerHasConfirmed: boolean;
  isActive: boolean;
  isCompleted: boolean;
  isPending: boolean;
  confirmAction: () => void;
  cancelAction: (reason?: string) => void;
  refreshSession: () => Promise<void>;
}

/**
 * Hook for managing a single exchange session
 */
export const useExchangeSession = (
  sessionId: string | undefined,
): UseExchangeSessionReturn => {
  const {
    getSessionById,
    fetchSession,
    confirmExchange,
    cancelSession,
    isLoading,
  } = useExchangeStore();

  const session = sessionId ? getSessionById(sessionId) : undefined;
  const userId = CURRENT_USER_ID;

  // Fetch fresh session data on mount and when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  const isInitiator = session?.initiatorUserId === userId;
  const isTaker = session?.takerUserId === userId;
  const partner = session
    ? isInitiator
      ? session.taker
      : session.initiator
    : null;

  const canConfirm = session ? canUserConfirm(session, userId) : false;
  const hasConfirmed = session
    ? isInitiator
      ? session.confirmations.initiatorConfirmed
      : session.confirmations.takerConfirmed
    : false;
  const partnerHasConfirmed = session
    ? isInitiator
      ? session.confirmations.takerConfirmed
      : session.confirmations.initiatorConfirmed
    : false;

  const isActive = session ? isExchangeActive(session) : false;
  const isCompleted = session ? isExchangeCompleted(session) : false;
  const isPending = session?.status === "PENDING_APPROVAL";

  const confirmAction = useCallback(() => {
    if (session && canConfirm) {
      // Initiator confirms "sent", taker confirms "received"
      const confirmationType = isInitiator ? "sent" : "received";
      confirmExchange(session.id, userId, confirmationType);
    }
  }, [session, canConfirm, confirmExchange, userId, isInitiator]);

  const cancelAction = useCallback(
    (reason?: string) => {
      if (session && isActive) {
        cancelSession(session.id, reason);
      }
    },
    [session, isActive, cancelSession],
  );

  const refreshSession = useCallback(async () => {
    if (sessionId) {
      await fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  return {
    session,
    isLoading,
    isInitiator,
    isTaker,
    partner,
    canConfirm,
    hasConfirmed,
    partnerHasConfirmed,
    isActive,
    isCompleted,
    isPending,
    confirmAction,
    cancelAction,
    refreshSession,
  };
};

// ============================================================================
// useExchangeConfirmation
// ============================================================================

interface UseExchangeConfirmationReturn {
  canUserConfirmAction: boolean;
  userHasConfirmed: boolean;
  partnerHasConfirmed: boolean;
  bothConfirmed: boolean;
  confirmationLabel: string;
  confirmAction: () => void;
}

/**
 * Hook specifically for confirmation logic
 */
export const useExchangeConfirmation = (
  session: ExchangeSession | undefined,
): UseExchangeConfirmationReturn => {
  const { confirmExchange } = useExchangeStore();
  const userId = CURRENT_USER_ID;

  const isInitiator = session?.initiatorUserId === userId;

  const canUserConfirmAction = session
    ? canUserConfirm(session, userId)
    : false;

  const userHasConfirmed = session
    ? isInitiator
      ? session.confirmations.initiatorConfirmed
      : session.confirmations.takerConfirmed
    : false;

  const partnerHasConfirmed = session
    ? isInitiator
      ? session.confirmations.takerConfirmed
      : session.confirmations.initiatorConfirmed
    : false;

  const bothConfirmed = userHasConfirmed && partnerHasConfirmed;

  // Determine label based on role and exchange type
  const confirmationLabel = useMemo(() => {
    if (!session) return "";

    if (session.type === "FX") {
      return isInitiator
        ? "exchange.confirm.sent"
        : "exchange.confirm.received";
    } else {
      // Shipping
      return isInitiator
        ? "exchange.confirm.shipped"
        : "exchange.confirm.delivered";
    }
  }, [session, isInitiator]);

  const confirmAction = useCallback(() => {
    if (session && canUserConfirmAction) {
      // Initiator confirms "sent", taker confirms "received"
      const confirmationType = isInitiator ? "sent" : "received";
      confirmExchange(session.id, userId, confirmationType);
    }
  }, [session, canUserConfirmAction, confirmExchange, userId, isInitiator]);

  return {
    canUserConfirmAction,
    userHasConfirmed,
    partnerHasConfirmed,
    bothConfirmed,
    confirmationLabel,
    confirmAction,
  };
};

// ============================================================================
// useExchangeRating
// ============================================================================

interface UseExchangeRatingReturn {
  canRate: boolean;
  hasRated: boolean;
  partnerHasRated: boolean;
  submitRating: (rating: number, comment?: string) => void;
}

/**
 * Hook for rating functionality
 */
export const useExchangeRating = (
  session: ExchangeSession | undefined,
): UseExchangeRatingReturn => {
  const { addRating, hasUserRatedExchange } = useExchangeStore();
  const userId = CURRENT_USER_ID;

  const isCompleted = session ? isExchangeCompleted(session) : false;
  const hasRated = session ? hasUserRatedExchange(session.id, userId) : false;
  const partnerId = session
    ? session.initiatorUserId === userId
      ? session.takerUserId
      : session.initiatorUserId
    : "";
  const partnerHasRated = session
    ? hasUserRatedExchange(session.id, partnerId)
    : false;

  const canRate = isCompleted && !hasRated;

  const submitRating = useCallback(
    (rating: number, comment?: string) => {
      if (session && canRate) {
        addRating(session.id, userId, partnerId, rating, comment);
      }
    },
    [session, canRate, addRating, userId, partnerId],
  );

  return {
    canRate,
    hasRated,
    partnerHasRated,
    submitRating,
  };
};

// ============================================================================
// useCreateExchangeSession
// ============================================================================

interface UseCreateExchangeSessionReturn {
  isCreating: boolean;
  createFXSession: (
    offerId: string,
    initiator: User,
    agreedAmount: FXAgreedAmount,
  ) => Promise<ExchangeSession | null>;
  createShippingSession: (
    offerId: string,
    initiator: User,
    agreedAmount: ShippingAgreedAmount,
  ) => Promise<ExchangeSession | null>;
  errorCode: string | null;
  clearError: () => void;
}

/**
 * Hook for creating exchange sessions
 */
export const useCreateExchangeSession = (): UseCreateExchangeSessionReturn => {
  const { createSession, errorCode, clearError } = useExchangeStore();
  const [isCreating, setIsCreating] = useState(false);

  // Current user as taker
  const currentTaker: User = useMemo(
    () => ({
      id: CURRENT_USER_ID,
      name: "Mamadou Diallo",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      country: "TR",
      city: "Istanbul",
      isVerified: true,
      rating: 4.8,
      totalDeals: 23,
    }),
    [],
  );

  const createFXSession = useCallback(
    async (offerId: string, initiator: User, agreedAmount: FXAgreedAmount) => {
      setIsCreating(true);
      try {
        return await createSession(
          "FX",
          offerId,
          initiator,
          currentTaker,
          agreedAmount,
        );
      } finally {
        setIsCreating(false);
      }
    },
    [createSession, currentTaker],
  );

  const createShippingSession = useCallback(
    async (
      offerId: string,
      initiator: User,
      agreedAmount: ShippingAgreedAmount,
    ) => {
      setIsCreating(true);
      try {
        return await createSession(
          "SHIPPING",
          offerId,
          initiator,
          currentTaker,
          agreedAmount,
        );
      } finally {
        setIsCreating(false);
      }
    },
    [createSession, currentTaker],
  );

  return {
    isCreating,
    createFXSession,
    createShippingSession,
    errorCode,
    clearError,
  };
};

// ============================================================================
// useUserExchanges
// ============================================================================

interface UseUserExchangesReturn {
  allExchanges: ExchangeSession[];
  activeExchanges: ExchangeSession[];
  completedExchanges: ExchangeSession[];
  pendingRequests: ExchangeSession[];
  fxExchanges: ExchangeSession[];
  shippingExchanges: ExchangeSession[];
  totalCount: number;
  activeCount: number;
  completedCount: number;
  pendingCount: number;
}

/**
 * Hook for getting user's exchanges
 */
export const useUserExchanges = (): UseUserExchangesReturn => {
  const {
    getSessionsByUser,
    getActiveSessionsForUser,
    getCompletedSessionsForUser,
  } = useExchangeStore();

  const userId = CURRENT_USER_ID;

  const allExchanges = getSessionsByUser(userId);
  const activeExchanges = getActiveSessionsForUser(userId);
  const completedExchanges = getCompletedSessionsForUser(userId);

  const pendingRequests = useMemo(
    () =>
      allExchanges.filter(
        (e) => e.status === "PENDING_APPROVAL" && e.initiatorUserId === userId,
      ),
    [allExchanges, userId],
  );

  const fxExchanges = useMemo(
    () => allExchanges.filter((e) => e.type === "FX"),
    [allExchanges],
  );

  const shippingExchanges = useMemo(
    () => allExchanges.filter((e) => e.type === "SHIPPING"),
    [allExchanges],
  );

  return {
    allExchanges,
    activeExchanges,
    completedExchanges,
    pendingRequests,
    fxExchanges,
    shippingExchanges,
    totalCount: allExchanges.length,
    activeCount: activeExchanges.length,
    completedCount: completedExchanges.length,
    pendingCount: pendingRequests.length,
  };
};

// ============================================================================
// useOfferExchangeRequests
// ============================================================================

interface UseOfferExchangeRequestsReturn {
  pendingRequests: ExchangeSession[];
  acceptedSessions: ExchangeSession[];
  hasPendingRequests: boolean;
  pendingCount: number;
  acceptRequest: (sessionId: string) => Promise<boolean>;
  declineRequest: (sessionId: string) => Promise<boolean>;
}

/**
 * Hook for managing exchange requests on an offer (for offer owner)
 */
export const useOfferExchangeRequests = (
  offerId: string,
): UseOfferExchangeRequestsReturn => {
  const {
    getPendingRequestsForOffer,
    getSessionsByOffer,
    acceptSession,
    declineSession,
  } = useExchangeStore();

  const pendingRequests = getPendingRequestsForOffer(offerId);
  const allSessions = getSessionsByOffer(offerId);

  const acceptedSessions = useMemo(
    () =>
      allSessions.filter(
        (s) => s.status !== "PENDING_APPROVAL" && s.status !== "CANCELLED",
      ),
    [allSessions],
  );

  const acceptRequest = useCallback(
    async (sessionId: string) => {
      return acceptSession(sessionId);
    },
    [acceptSession],
  );

  const declineRequest = useCallback(
    async (sessionId: string) => {
      return declineSession(sessionId);
    },
    [declineSession],
  );

  return {
    pendingRequests,
    acceptedSessions,
    hasPendingRequests: pendingRequests.length > 0,
    pendingCount: pendingRequests.length,
    acceptRequest,
    declineRequest,
  };
};

// ============================================================================
// useUserTrust
// ============================================================================

interface UseUserTrustReturn {
  completedExchanges: number;
  averageRating: number;
  totalRatings: number;
  trustBadge: string;
  trustBadgeColor: string;
  trustBadgeIcon: string;
}

/**
 * Hook for user trust information
 */
export const useUserTrust = (userId?: string): UseUserTrustReturn => {
  const { getUserTrustProfile } = useExchangeStore();

  const profile = getUserTrustProfile(userId || CURRENT_USER_ID);

  const trustBadgeColor = useMemo(() => {
    switch (profile.trustBadge) {
      case "TOP_TRADER":
        return "#FFD700"; // Gold
      case "TRUSTED":
        return "#10B981"; // Green
      case "VERIFIED":
        return "#3B82F6"; // Blue
      default:
        return "#94A3B8"; // Gray
    }
  }, [profile.trustBadge]);

  const trustBadgeIcon = useMemo(() => {
    switch (profile.trustBadge) {
      case "TOP_TRADER":
        return "trophy";
      case "TRUSTED":
        return "shield-checkmark";
      case "VERIFIED":
        return "checkmark-circle";
      default:
        return "person";
    }
  }, [profile.trustBadge]);

  return {
    completedExchanges: profile.completedExchanges,
    averageRating: profile.averageRating,
    totalRatings: profile.totalRatings,
    trustBadge: profile.trustBadge,
    trustBadgeColor,
    trustBadgeIcon,
  };
};
