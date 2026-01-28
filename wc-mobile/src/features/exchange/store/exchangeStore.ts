/**
 * Exchange Store (Zustand)
 *
 * State management for Exchange Sessions, Ratings, and Trust System.
 * Integrates with backend API with mock fallback.
 */

import { create } from "zustand";
import {
  ExchangeSession,
  ExchangeType,
  ExchangeStatus,
  ExchangeRating,
  FXAgreedAmount,
  ShippingAgreedAmount,
  UserTrustProfile,
  calculateTrustBadge,
} from "../model/types";
import { User } from "@/features/fx/model/types";
import {
  listSessions as apiListSessions,
  getSession as apiGetSession,
  createSession as apiCreateSession,
  acceptSession as apiAcceptSession,
  declineSession as apiDeclineSession,
  cancelSession as apiCancelSession,
  confirmSession as apiConfirmSession,
  createRating as apiCreateRating,
  USE_API,
  ApiClientError,
} from "@/api";

// ============================================================================
// ERROR MAPPING
// ============================================================================

/**
 * Map API error codes to user-friendly messages.
 */
function mapErrorToUserFriendlyMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const errorMap: Record<string, string> = {
      // Session errors
      SESSION_NOT_FOUND: "Exchange session not found",
      SESSION_ALREADY_EXISTS:
        "You already have an active exchange with this offer",
      SESSION_INVALID_STATUS:
        "This action cannot be performed on the current session",
      SESSION_ALREADY_COMPLETED: "This exchange has already been completed",
      SESSION_ALREADY_CANCELLED: "This exchange has been cancelled",
      // Offer errors
      OFFER_NOT_FOUND: "This offer is no longer available",
      OFFER_EXPIRED: "This offer has expired",
      OFFER_INACTIVE: "This offer is no longer active",
      // Auth errors
      UNAUTHORIZED: "Please log in to continue",
      FORBIDDEN: "You don't have permission to perform this action",
      // General errors
      VALIDATION_ERROR: "Please check your input and try again",
      NETWORK_ERROR: "Unable to connect. Please check your internet connection",
      RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
    };

    return errorMap[error.code] || error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Current user ID for mock purposes
export const CURRENT_USER_ID = "u1";

const mockExchangeSessions: ExchangeSession[] = [
  {
    id: "ex-1",
    type: "FX",
    offerId: "fx-1",
    initiatorUserId: "u2",
    takerUserId: CURRENT_USER_ID,
    initiator: {
      id: "u2",
      name: "Fatoumata Camara",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
      country: "GN",
      city: "Conakry",
      isVerified: true,
      rating: 4.9,
      totalDeals: 45,
    },
    taker: {
      id: CURRENT_USER_ID,
      name: "Mamadou Diallo",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      country: "TR",
      city: "Istanbul",
      isVerified: true,
      rating: 4.8,
      totalDeals: 23,
    },
    agreedAmount: {
      fromAmount: 500,
      toAmount: 5500000,
      fromCurrency: "EUR",
      toCurrency: "GNF",
      rate: 11000,
      isFullAmount: true,
    } as FXAgreedAmount,
    status: "IN_PROGRESS",
    confirmations: {
      initiatorConfirmed: false,
      takerConfirmed: false,
    },
    conversationId: "conv-ex-1",
    createdAt: "2026-01-19T10:00:00Z",
    updatedAt: "2026-01-19T14:00:00Z",
  },
  {
    id: "ex-2",
    type: "FX",
    offerId: "fx-3",
    initiatorUserId: CURRENT_USER_ID,
    takerUserId: "u3",
    initiator: {
      id: CURRENT_USER_ID,
      name: "Mamadou Diallo",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      country: "TR",
      city: "Istanbul",
      isVerified: true,
      rating: 4.8,
      totalDeals: 23,
    },
    taker: {
      id: "u3",
      name: "Ibrahima Bah",
      avatar: "https://randomuser.me/api/portraits/men/3.jpg",
      country: "TR",
      city: "Ankara",
      isVerified: false,
      rating: 4.2,
      totalDeals: 5,
    },
    agreedAmount: {
      fromAmount: 200,
      toAmount: 2200000,
      fromCurrency: "EUR",
      toCurrency: "GNF",
      rate: 11000,
      isFullAmount: false,
    } as FXAgreedAmount,
    status: "PENDING_APPROVAL",
    confirmations: {
      initiatorConfirmed: false,
      takerConfirmed: false,
    },
    conversationId: "conv-ex-2",
    createdAt: "2026-01-20T08:00:00Z",
    updatedAt: "2026-01-20T08:00:00Z",
  },
  {
    id: "ex-3",
    type: "FX",
    offerId: "fx-2",
    initiatorUserId: "u4",
    takerUserId: CURRENT_USER_ID,
    initiator: {
      id: "u4",
      name: "Aissatou Barry",
      avatar: "https://randomuser.me/api/portraits/women/4.jpg",
      country: "FR",
      city: "Paris",
      isVerified: true,
      rating: 5.0,
      totalDeals: 78,
    },
    taker: {
      id: CURRENT_USER_ID,
      name: "Mamadou Diallo",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      country: "TR",
      city: "Istanbul",
      isVerified: true,
      rating: 4.8,
      totalDeals: 23,
    },
    agreedAmount: {
      fromAmount: 1000,
      toAmount: 1100,
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: 1.1,
      isFullAmount: true,
    } as FXAgreedAmount,
    status: "COMPLETED",
    confirmations: {
      initiatorConfirmed: true,
      takerConfirmed: true,
      initiatorConfirmedAt: "2026-01-15T16:00:00Z",
      takerConfirmedAt: "2026-01-15T18:00:00Z",
    },
    conversationId: "conv-ex-3",
    createdAt: "2026-01-14T09:00:00Z",
    updatedAt: "2026-01-15T18:00:00Z",
    completedAt: "2026-01-15T18:00:00Z",
  },
];

const mockRatings: ExchangeRating[] = [
  {
    id: "rating-1",
    exchangeId: "ex-3",
    fromUserId: CURRENT_USER_ID,
    toUserId: "u4",
    rating: 5,
    comment: "Excellent transaction, très rapide et fiable !",
    createdAt: "2026-01-15T18:30:00Z",
  },
  {
    id: "rating-2",
    exchangeId: "ex-3",
    fromUserId: "u4",
    toUserId: CURRENT_USER_ID,
    rating: 5,
    comment: "Parfait, je recommande.",
    createdAt: "2026-01-15T19:00:00Z",
  },
];

// ============================================================================
// API MAPPING
// ============================================================================

/**
 * Map backend API session to frontend ExchangeSession model.
 */
function mapApiToSession(apiSession: any): ExchangeSession {
  // Map status from backend format to frontend format
  const statusMap: Record<string, ExchangeStatus> = {
    pending: "PENDING_APPROVAL",
    accepted: "IN_PROGRESS",
    in_progress: "IN_PROGRESS",
    in_transit: "IN_TRANSIT",
    delivered: "DELIVERED_PENDING_CONFIRMATION",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
    declined: "CANCELLED",
    expired: "CANCELLED",
  };

  // Determine type from offer
  const type: ExchangeType =
    apiSession.offer?.type === "shipping" ? "SHIPPING" : "FX";

  // Build agreed amount based on type
  let agreedAmount: FXAgreedAmount | ShippingAgreedAmount;
  if (type === "FX") {
    agreedAmount = {
      fromAmount:
        apiSession.agreedAmount || apiSession.offer?.sourceAmount || 0,
      toAmount:
        apiSession.agreedAmount && apiSession.offer?.rate
          ? apiSession.agreedAmount * apiSession.offer.rate
          : 0,
      fromCurrency: apiSession.offer?.sourceCurrency || "EUR",
      toCurrency: apiSession.offer?.targetCurrency || "GNF",
      rate: apiSession.offer?.rate || 0,
      isFullAmount:
        !apiSession.agreedAmount ||
        apiSession.agreedAmount === apiSession.offer?.sourceAmount,
    };
  } else {
    agreedAmount = {
      description: apiSession.offer?.title || "",
      weight: apiSession.agreedAmount
        ? `${apiSession.agreedAmount}kg`
        : undefined,
      price: apiSession.offer?.pricePerKg
        ? `${apiSession.offer.pricePerKg} GNF/kg`
        : undefined,
    };
  }

  // Build initiator user (offer owner / responder in API terms)
  const initiator: User = {
    id: apiSession.responder?.id || "",
    name: apiSession.responder?.displayName || "Unknown",
    avatar: apiSession.responder?.avatarUrl || undefined,
    country:
      apiSession.offer?.origin?.country ||
      apiSession.offer?.location?.country ||
      "",
    city:
      apiSession.offer?.origin?.city || apiSession.offer?.location?.city || "",
    isVerified: (apiSession.responder?.trustScore || 0) >= 50,
    rating: (apiSession.responder?.trustScore || 0) / 20,
    totalDeals: 0,
  };

  // Build taker user (session initiator in API terms)
  const taker: User = {
    id: apiSession.initiator?.id || "",
    name: apiSession.initiator?.displayName || "Unknown",
    avatar: apiSession.initiator?.avatarUrl || undefined,
    country: "",
    city: "",
    isVerified: (apiSession.initiator?.trustScore || 0) >= 50,
    rating: (apiSession.initiator?.trustScore || 0) / 20,
    totalDeals: 0,
  };

  // Parse confirmations
  const confirmations = apiSession.confirmations || [];
  const initiatorConfirmation = confirmations.find(
    (c: any) => c.userId === apiSession.responder?.id && c.type === "sent",
  );
  const takerConfirmation = confirmations.find(
    (c: any) => c.userId === apiSession.initiator?.id && c.type === "received",
  );

  return {
    id: apiSession.id,
    type,
    offerId: apiSession.offer?.id || "",
    initiatorUserId: apiSession.responder?.id || "",
    takerUserId: apiSession.initiator?.id || "",
    initiator,
    taker,
    agreedAmount,
    status: statusMap[apiSession.status] || "PENDING_APPROVAL",
    confirmations: {
      initiatorConfirmed: !!initiatorConfirmation,
      takerConfirmed: !!takerConfirmation,
      initiatorConfirmedAt: initiatorConfirmation?.confirmedAt,
      takerConfirmedAt: takerConfirmation?.confirmedAt,
    },
    // Only use real conversation ID from API - don't create fake conv- prefixed IDs
    conversationId: apiSession.conversation?.id || undefined,
    createdAt: apiSession.createdAt,
    updatedAt: apiSession.updatedAt,
    completedAt:
      apiSession.status === "completed" ? apiSession.updatedAt : undefined,
    cancelledAt: ["cancelled", "declined"].includes(apiSession.status)
      ? apiSession.updatedAt
      : undefined,
  };
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ExchangeState {
  // Data
  sessions: ExchangeSession[];
  ratings: ExchangeRating[];
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;

  // Actions - Sessions
  loadSessions: () => Promise<void>;
  createSession: (
    type: ExchangeType,
    offerId: string,
    initiator: User,
    taker: User,
    agreedAmount: FXAgreedAmount | ShippingAgreedAmount,
  ) => Promise<ExchangeSession | null>;
  acceptSession: (sessionId: string) => Promise<boolean>;
  declineSession: (sessionId: string, reason?: string) => Promise<boolean>;
  updateSessionStatus: (sessionId: string, status: ExchangeStatus) => void;
  confirmExchange: (
    sessionId: string,
    userId: string,
    type: "sent" | "received",
  ) => Promise<boolean>;
  cancelSession: (sessionId: string, reason?: string) => Promise<boolean>;
  clearError: () => void;

  // Actions - Ratings
  addRating: (
    exchangeId: string,
    fromUserId: string,
    toUserId: string,
    rating: number,
    comment?: string,
  ) => Promise<void>;
  hasUserRatedExchange: (exchangeId: string, userId: string) => boolean;

  // Selectors
  getSessionById: (id: string) => ExchangeSession | undefined;
  fetchSession: (id: string) => Promise<ExchangeSession | null>;
  getSessionsByUser: (userId: string) => ExchangeSession[];
  getSessionsByOffer: (offerId: string) => ExchangeSession[];
  getPendingRequestsForOffer: (offerId: string) => ExchangeSession[];
  getActiveSessionsForUser: (userId: string) => ExchangeSession[];
  getCompletedSessionsForUser: (userId: string) => ExchangeSession[];
  getUserTrustProfile: (userId: string) => UserTrustProfile;
  getRatingsForUser: (userId: string) => ExchangeRating[];
  getSessionByConversation: (
    conversationId: string,
  ) => ExchangeSession | undefined;
  getUserSessionForOffer: (
    offerId: string,
    userId: string,
  ) => ExchangeSession | undefined;
  hasActiveSessionForOffer: (offerId: string, userId: string) => boolean;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  sessions: [],
  ratings: [],
  isLoading: false,
  error: null,
  errorCode: null,

  clearError: () => set({ error: null, errorCode: null }),

  // Load sessions from API
  loadSessions: async () => {
    set({ isLoading: true, error: null });
    console.log("[ExchangeStore] Loading sessions...");

    try {
      if (!USE_API) {
        // Mock mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({
          sessions: mockExchangeSessions,
          ratings: mockRatings,
          isLoading: false,
        });
        console.log(
          "[ExchangeStore] Mock sessions loaded:",
          mockExchangeSessions.length,
        );
        return;
      }

      // API mode
      const { sessions: apiSessions } = await apiListSessions();
      const mappedSessions = apiSessions.map(mapApiToSession);

      set({
        sessions: mappedSessions,
        ratings: mockRatings, // Ratings still mock for now
        isLoading: false,
      });
      console.log(
        "[ExchangeStore] API sessions loaded:",
        mappedSessions.length,
      );
    } catch (error: any) {
      console.error("[ExchangeStore] Failed to load sessions:", error);
      // Fallback to mock on error
      set({
        sessions: mockExchangeSessions,
        ratings: mockRatings,
        isLoading: false,
        error: mapErrorToUserFriendlyMessage(error),
      });
    }
  },

  // Create new exchange session
  createSession: async (type, offerId, initiator, taker, agreedAmount) => {
    console.log("[ExchangeStore] Creating session for offer:", offerId);

    try {
      if (!USE_API) {
        // Mock mode
        const newSession: ExchangeSession = {
          id: `ex-${Date.now()}`,
          type,
          offerId,
          initiatorUserId: initiator.id,
          takerUserId: taker.id,
          initiator,
          taker,
          agreedAmount,
          status: "PENDING_APPROVAL",
          confirmations: {
            initiatorConfirmed: false,
            takerConfirmed: false,
          },
          conversationId: `conv-ex-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
        }));

        console.log("[ExchangeStore] Mock session created:", newSession.id);
        return newSession;
      }

      // API mode - determine amount to send
      let apiAgreedAmount: number | undefined;
      if ("fromAmount" in agreedAmount) {
        apiAgreedAmount = agreedAmount.fromAmount;
      } else if ("weight" in agreedAmount && agreedAmount.weight) {
        apiAgreedAmount = parseFloat(agreedAmount.weight);
      }

      const apiSession = await apiCreateSession({
        offerId,
        agreedAmount: apiAgreedAmount,
        notes:
          "description" in agreedAmount ? agreedAmount.description : undefined,
      });

      const newSession = mapApiToSession(apiSession);

      // Override with local user data for immediate display
      newSession.initiator = initiator;
      newSession.taker = taker;
      newSession.agreedAmount = agreedAmount;
      newSession.type = type;

      set((state) => ({
        sessions: [newSession, ...state.sessions],
      }));

      console.log("[ExchangeStore] API session created:", newSession.id);
      return newSession;
    } catch (error: any) {
      console.error("[ExchangeStore] Failed to create session:", error);
      const errorCode = error?.code || "UNKNOWN_ERROR";
      set({
        error: mapErrorToUserFriendlyMessage(error),
        errorCode,
      });
      return null;
    }
  },

  // Accept session (offer owner accepts request)
  acceptSession: async (sessionId) => {
    console.log("[ExchangeStore] Accepting session:", sessionId);

    try {
      if (!USE_API) {
        get().updateSessionStatus(sessionId, "IN_PROGRESS");
        return true;
      }

      const updatedApiSession = await apiAcceptSession(sessionId);

      // Update local state with the API response (includes conversationId)
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: "IN_PROGRESS" as ExchangeStatus,
                conversationId:
                  updatedApiSession.conversation?.id || s.conversationId,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      }));

      console.log(
        "[ExchangeStore] Session accepted:",
        sessionId,
        "conversationId:",
        updatedApiSession.conversation?.id,
      );
      return true;
    } catch (error: any) {
      console.error("[ExchangeStore] Failed to accept session:", error);
      set({ error: mapErrorToUserFriendlyMessage(error) });
      return false;
    }
  },

  // Decline session
  declineSession: async (sessionId, reason) => {
    console.log("[ExchangeStore] Declining session:", sessionId);

    try {
      if (!USE_API) {
        get().updateSessionStatus(sessionId, "CANCELLED");
        return true;
      }

      await apiDeclineSession(sessionId, reason);

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: "CANCELLED" as ExchangeStatus,
                cancelledAt: new Date().toISOString(),
                cancelReason: reason,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      }));

      console.log("[ExchangeStore] Session declined:", sessionId);
      return true;
    } catch (error: any) {
      console.error("[ExchangeStore] Failed to decline session:", error);
      set({ error: mapErrorToUserFriendlyMessage(error) });
      return false;
    }
  },

  // Update session status (local only, for mock compatibility)
  updateSessionStatus: (sessionId, status) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status,
              updatedAt: new Date().toISOString(),
              ...(status === "COMPLETED" && {
                completedAt: new Date().toISOString(),
              }),
              ...(status === "CANCELLED" && {
                cancelledAt: new Date().toISOString(),
              }),
            }
          : session,
      ),
    }));
  },

  // Confirm exchange (sent or received)
  confirmExchange: async (sessionId, userId, confirmationType) => {
    console.log(
      "[ExchangeStore] Confirming exchange:",
      sessionId,
      confirmationType,
    );

    try {
      if (!USE_API) {
        // Mock mode - use old logic
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (!session) return state;

          const isInitiator = userId === session.initiatorUserId;
          const now = new Date().toISOString();

          const updatedConfirmations = {
            ...session.confirmations,
            ...(isInitiator
              ? { initiatorConfirmed: true, initiatorConfirmedAt: now }
              : { takerConfirmed: true, takerConfirmedAt: now }),
          };

          const bothConfirmed =
            updatedConfirmations.initiatorConfirmed &&
            updatedConfirmations.takerConfirmed;

          return {
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    confirmations: updatedConfirmations,
                    status: bothConfirmed
                      ? ("COMPLETED" as ExchangeStatus)
                      : s.status,
                    updatedAt: now,
                    ...(bothConfirmed && { completedAt: now }),
                  }
                : s,
            ),
          };
        });
        return true;
      }

      // API mode
      const apiSession = await apiConfirmSession(sessionId, confirmationType);
      const updatedSession = mapApiToSession(apiSession);

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, ...updatedSession } : s,
        ),
      }));

      console.log("[ExchangeStore] Exchange confirmed:", sessionId);
      return true;
    } catch (error: any) {
      console.error("[ExchangeStore] Failed to confirm exchange:", error);
      set({ error: mapErrorToUserFriendlyMessage(error) });
      return false;
    }
  },

  // Cancel session
  cancelSession: async (sessionId, reason) => {
    console.log("[ExchangeStore] Cancelling session:", sessionId);

    try {
      if (!USE_API) {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  status: "CANCELLED" as ExchangeStatus,
                  cancelledAt: new Date().toISOString(),
                  cancelReason: reason,
                  updatedAt: new Date().toISOString(),
                }
              : session,
          ),
        }));
        return true;
      }

      await apiCancelSession(sessionId, reason);

      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: "CANCELLED" as ExchangeStatus,
                cancelledAt: new Date().toISOString(),
                cancelReason: reason,
                updatedAt: new Date().toISOString(),
              }
            : session,
        ),
      }));

      console.log("[ExchangeStore] Session cancelled:", sessionId);
      return true;
    } catch (error: any) {
      console.error("[ExchangeStore] Failed to cancel session:", error);
      set({ error: mapErrorToUserFriendlyMessage(error) });
      return false;
    }
  },

  // Add rating
  addRating: async (exchangeId, fromUserId, toUserId, rating, comment) => {
    console.log("[ExchangeStore] Adding rating for exchange:", exchangeId);

    const newRating: ExchangeRating = {
      id: `rating-${Date.now()}`,
      exchangeId,
      fromUserId,
      toUserId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add to local state
    set((state) => ({
      ratings: [...state.ratings, newRating],
    }));

    // Call API if enabled
    if (USE_API) {
      try {
        const apiRating = await apiCreateRating(exchangeId, {
          score: rating,
          comment: comment,
        });
        console.log("[ExchangeStore] Rating created on API:", apiRating.id);

        // Update with actual ID from API
        set((state) => ({
          ratings: state.ratings.map((r) =>
            r.id === newRating.id ? { ...r, id: apiRating.id } : r,
          ),
        }));
      } catch (error) {
        console.error("[ExchangeStore] Failed to create rating on API:", error);
        // Keep local rating for now (optimistic)
      }
    }
  },

  // Check if user has rated exchange
  hasUserRatedExchange: (exchangeId, userId) => {
    return get().ratings.some(
      (r) => r.exchangeId === exchangeId && r.fromUserId === userId,
    );
  },

  // Get session by ID
  getSessionById: (id) => {
    return get().sessions.find((s) => s.id === id);
  },

  // Fetch session from API and update local state
  fetchSession: async (id) => {
    console.log("[ExchangeStore] Fetching session:", id);

    try {
      if (!USE_API) {
        return get().getSessionById(id) || null;
      }

      const apiSession = await apiGetSession(id);
      const mappedSession = mapApiToSession(apiSession);

      // Update local state
      set((state) => {
        const existingIndex = state.sessions.findIndex((s) => s.id === id);
        if (existingIndex >= 0) {
          const newSessions = [...state.sessions];
          newSessions[existingIndex] = mappedSession;
          return { sessions: newSessions };
        } else {
          return { sessions: [mappedSession, ...state.sessions] };
        }
      });

      console.log(
        "[ExchangeStore] Session fetched:",
        id,
        "conversationId:",
        mappedSession.conversationId,
      );
      return mappedSession;
    } catch (error: any) {
      console.error("[ExchangeStore] Failed to fetch session:", error);
      return null;
    }
  },

  // Get sessions by user (as initiator or taker)
  getSessionsByUser: (userId) => {
    return get().sessions.filter(
      (s) => s.initiatorUserId === userId || s.takerUserId === userId,
    );
  },

  // Get sessions for an offer
  getSessionsByOffer: (offerId) => {
    return get().sessions.filter((s) => s.offerId === offerId);
  },

  // Get pending requests for an offer
  getPendingRequestsForOffer: (offerId) => {
    return get().sessions.filter(
      (s) => s.offerId === offerId && s.status === "PENDING_APPROVAL",
    );
  },

  // Get active sessions for user
  getActiveSessionsForUser: (userId) => {
    return get().sessions.filter(
      (s) =>
        (s.initiatorUserId === userId || s.takerUserId === userId) &&
        s.status !== "COMPLETED" &&
        s.status !== "CANCELLED",
    );
  },

  // Get completed sessions for user
  getCompletedSessionsForUser: (userId) => {
    return get().sessions.filter(
      (s) =>
        (s.initiatorUserId === userId || s.takerUserId === userId) &&
        s.status === "COMPLETED",
    );
  },

  // Get user trust profile
  getUserTrustProfile: (userId) => {
    const userRatings = get().ratings.filter((r) => r.toUserId === userId);
    const userSessions = get().sessions.filter(
      (s) => s.initiatorUserId === userId || s.takerUserId === userId,
    );
    const completedSessions = userSessions.filter(
      (s) => s.status === "COMPLETED",
    );

    const totalRatings = userRatings.length;
    const averageRating =
      totalRatings > 0
        ? userRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    return {
      userId,
      totalExchanges: userSessions.length,
      completedExchanges: completedSessions.length,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      trustBadge: calculateTrustBadge(completedSessions.length, averageRating),
    };
  },

  // Get ratings for user
  getRatingsForUser: (userId) => {
    return get().ratings.filter((r) => r.toUserId === userId);
  },

  // Get session by conversation ID
  getSessionByConversation: (conversationId) => {
    return get().sessions.find((s) => s.conversationId === conversationId);
  },

  // Get user's session for a specific offer (if any)
  getUserSessionForOffer: (offerId, userId) => {
    return get().sessions.find(
      (s) =>
        s.offerId === offerId &&
        (s.takerUserId === userId || s.initiatorUserId === userId),
    );
  },

  // Check if user has an active (non-cancelled/completed) session for an offer
  hasActiveSessionForOffer: (offerId, userId) => {
    const activeStatuses: ExchangeStatus[] = [
      "PENDING_APPROVAL",
      "IN_PROGRESS",
      "IN_TRANSIT",
      "DELIVERED_PENDING_CONFIRMATION",
    ];
    return get().sessions.some(
      (s) =>
        s.offerId === offerId &&
        s.takerUserId === userId &&
        activeStatuses.includes(s.status),
    );
  },
}));
