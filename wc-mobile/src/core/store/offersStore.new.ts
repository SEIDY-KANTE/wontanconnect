/**
 * Offers Store (Refactored)
 *
 * Production-ready Zustand store with:
 * - Proper API contract alignment
 * - NO mock fallbacks
 * - Proper error handling
 * - Optimized selectors (exported separately)
 *
 * CRITICAL CHANGES:
 * - Removed mock data fallback on error
 * - Uses new API contracts and adapters
 * - Proper error propagation to UI
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  listOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  getMyOffers,
  type OffersListResponse,
  type OfferResponse,
} from "@/api/offers.api.new";
import {
  type MobileOffer,
  type MobileCreateOfferRequest,
  type OfferFilters,
  type OfferType,
  type OfferStatus,
} from "@/api/contracts/offers";
import { type MobilePaginationMeta } from "@/api/contracts/pagination";
import { AppError, ErrorCode } from "@/api/contracts/common";
import { debugLog, errorLog } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

export type { MobileOffer as Offer };
export type { OfferType, OfferStatus };

/**
 * Loading states for granular UI feedback
 */
export type OffersLoadingState =
  | "idle"
  | "loading_fx"
  | "loading_shipping"
  | "loading_my"
  | "loading_detail"
  | "creating"
  | "updating"
  | "deleting"
  | "refreshing_fx"
  | "refreshing_shipping";

/**
 * Structured error for UI display
 */
export interface OffersError {
  code: string;
  message: string;
  isRetryable: boolean;
}

/**
 * Store state
 */
interface OffersState {
  // Data
  fxOffers: MobileOffer[];
  shippingOffers: MobileOffer[];
  myOffers: MobileOffer[];
  currentOffer: MobileOffer | null;

  // Loading states
  loadingState: OffersLoadingState;

  // Error state
  error: OffersError | null;

  // Pagination
  fxPagination: MobilePaginationMeta;
  shippingPagination: MobilePaginationMeta;
  myPagination: MobilePaginationMeta;
}

/**
 * Store actions
 */
interface OffersActions {
  // List operations
  loadFxOffers: (filters?: Omit<OfferFilters, "type">) => Promise<void>;
  loadShippingOffers: (filters?: Omit<OfferFilters, "type">) => Promise<void>;
  loadMoreFxOffers: () => Promise<void>;
  loadMoreShippingOffers: () => Promise<void>;
  loadMyOffers: (filters?: Omit<OfferFilters, "type">) => Promise<void>;
  loadOfferDetail: (id: string) => Promise<MobileOffer | null>;

  // Refresh operations
  refreshFxOffers: () => Promise<void>;
  refreshShippingOffers: () => Promise<void>;

  // CRUD operations
  createOffer: (data: MobileCreateOfferRequest) => Promise<MobileOffer | null>;
  updateOffer: (
    id: string,
    data: Partial<MobileCreateOfferRequest>,
  ) => Promise<MobileOffer | null>;
  deleteOffer: (id: string) => Promise<boolean>;

  // Utility actions
  clearError: () => void;
  clearCurrentOffer: () => void;
  getOfferById: (id: string, type: OfferType) => MobileOffer | undefined;
}

type OffersStore = OffersState & OffersActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialPagination: MobilePaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

const initialState: OffersState = {
  fxOffers: [],
  shippingOffers: [],
  myOffers: [],
  currentOffer: null,
  loadingState: "idle",
  error: null,
  fxPagination: { ...initialPagination },
  shippingPagination: { ...initialPagination },
  myPagination: { ...initialPagination },
};

// ============================================================================
// ERROR MAPPING
// ============================================================================

function mapToStoreError(error: unknown): OffersError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      isRetryable: error.isRetryable,
    };
  }

  return {
    code: ErrorCode.UNKNOWN,
    message:
      error instanceof Error ? error.message : "An unexpected error occurred",
    isRetryable: true,
  };
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useOffersStore = create<OffersStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // -------------------------------------------------------------------------
    // LOAD FX OFFERS
    // -------------------------------------------------------------------------

    loadFxOffers: async (filters) => {
      set({ loadingState: "loading_fx", error: null });
      debugLog("OffersStore", "Loading FX offers...", filters);

      try {
        const response = await listOffers({
          ...filters,
          type: "fx",
          status: "active",
        });

        set({
          fxOffers: response.offers,
          fxPagination: response.meta,
          loadingState: "idle",
        });

        debugLog("OffersStore", `FX offers loaded: ${response.offers.length}`);
      } catch (error) {
        errorLog("OffersStore", error, "loadFxOffers");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
          // CRITICAL: Do NOT fall back to mock data!
        });
      }
    },

    // -------------------------------------------------------------------------
    // LOAD MORE FX OFFERS (Pagination)
    // -------------------------------------------------------------------------

    loadMoreFxOffers: async () => {
      const { fxPagination, fxOffers, loadingState } = get();

      if (loadingState !== "idle" || !fxPagination.hasNext) {
        return;
      }

      set({ loadingState: "loading_fx" });
      debugLog(
        "OffersStore",
        "Loading more FX offers...",
        fxPagination.page + 1,
      );

      try {
        const response = await listOffers({
          type: "fx",
          status: "active",
          page: fxPagination.page + 1,
        });

        set({
          fxOffers: [...fxOffers, ...response.offers],
          fxPagination: response.meta,
          loadingState: "idle",
        });

        debugLog(
          "OffersStore",
          `Loaded ${response.offers.length} more FX offers`,
        );
      } catch (error) {
        errorLog("OffersStore", error, "loadMoreFxOffers");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
      }
    },

    // -------------------------------------------------------------------------
    // LOAD SHIPPING OFFERS
    // -------------------------------------------------------------------------

    loadShippingOffers: async (filters) => {
      set({ loadingState: "loading_shipping", error: null });
      debugLog("OffersStore", "Loading Shipping offers...", filters);

      try {
        const response = await listOffers({
          ...filters,
          type: "shipping",
          status: "active",
        });

        set({
          shippingOffers: response.offers,
          shippingPagination: response.meta,
          loadingState: "idle",
        });

        debugLog(
          "OffersStore",
          `Shipping offers loaded: ${response.offers.length}`,
        );
      } catch (error) {
        errorLog("OffersStore", error, "loadShippingOffers");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
      }
    },

    // -------------------------------------------------------------------------
    // LOAD MORE SHIPPING OFFERS (Pagination)
    // -------------------------------------------------------------------------

    loadMoreShippingOffers: async () => {
      const { shippingPagination, shippingOffers, loadingState } = get();

      if (loadingState !== "idle" || !shippingPagination.hasNext) {
        return;
      }

      set({ loadingState: "loading_shipping" });
      debugLog("OffersStore", "Loading more Shipping offers...");

      try {
        const response = await listOffers({
          type: "shipping",
          status: "active",
          page: shippingPagination.page + 1,
        });

        set({
          shippingOffers: [...shippingOffers, ...response.offers],
          shippingPagination: response.meta,
          loadingState: "idle",
        });
      } catch (error) {
        errorLog("OffersStore", error, "loadMoreShippingOffers");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
      }
    },

    // -------------------------------------------------------------------------
    // REFRESH OPERATIONS
    // -------------------------------------------------------------------------

    refreshFxOffers: async () => {
      set({ loadingState: "refreshing_fx", error: null });

      try {
        const response = await listOffers({
          type: "fx",
          status: "active",
          page: 1,
        });

        set({
          fxOffers: response.offers,
          fxPagination: response.meta,
          loadingState: "idle",
        });
      } catch (error) {
        errorLog("OffersStore", error, "refreshFxOffers");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
      }
    },

    refreshShippingOffers: async () => {
      set({ loadingState: "refreshing_shipping", error: null });

      try {
        const response = await listOffers({
          type: "shipping",
          status: "active",
          page: 1,
        });

        set({
          shippingOffers: response.offers,
          shippingPagination: response.meta,
          loadingState: "idle",
        });
      } catch (error) {
        errorLog("OffersStore", error, "refreshShippingOffers");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
      }
    },

    // -------------------------------------------------------------------------
    // LOAD MY OFFERS
    // -------------------------------------------------------------------------

    loadMyOffers: async (filters) => {
      set({ loadingState: "loading_my", error: null });
      debugLog("OffersStore", "Loading my offers...");

      try {
        const response = await getMyOffers(filters);

        set({
          myOffers: response.offers,
          myPagination: response.meta,
          loadingState: "idle",
        });

        debugLog("OffersStore", `My offers loaded: ${response.offers.length}`);
      } catch (error) {
        errorLog("OffersStore", error, "loadMyOffers");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
      }
    },

    // -------------------------------------------------------------------------
    // LOAD OFFER DETAIL
    // -------------------------------------------------------------------------

    loadOfferDetail: async (id) => {
      set({ loadingState: "loading_detail", error: null });
      debugLog("OffersStore", "Loading offer detail:", id);

      try {
        const response = await getOffer(id);

        set({
          currentOffer: response.offer,
          loadingState: "idle",
        });

        return response.offer;
      } catch (error) {
        errorLog("OffersStore", error, `loadOfferDetail(${id})`);
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
        return null;
      }
    },

    // -------------------------------------------------------------------------
    // CREATE OFFER
    // -------------------------------------------------------------------------

    createOffer: async (data) => {
      set({ loadingState: "creating", error: null });
      debugLog("OffersStore", "Creating offer:", data.type);

      try {
        const response = await createOffer(data);

        // Add to appropriate list
        if (data.type === "fx") {
          set((state) => ({
            fxOffers: [response.offer, ...state.fxOffers],
            myOffers: [response.offer, ...state.myOffers],
            loadingState: "idle",
          }));
        } else {
          set((state) => ({
            shippingOffers: [response.offer, ...state.shippingOffers],
            myOffers: [response.offer, ...state.myOffers],
            loadingState: "idle",
          }));
        }

        debugLog("OffersStore", "Offer created:", response.offer.id);
        return response.offer;
      } catch (error) {
        errorLog("OffersStore", error, "createOffer");
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
        return null;
      }
    },

    // -------------------------------------------------------------------------
    // UPDATE OFFER
    // -------------------------------------------------------------------------

    updateOffer: async (id, data) => {
      set({ loadingState: "updating", error: null });
      debugLog("OffersStore", "Updating offer:", id);

      try {
        const response = await updateOffer(id, data);
        const updated = response.offer;

        // Update in all relevant lists
        set((state) => {
          const updateInList = (offers: MobileOffer[]) =>
            offers.map((o) => (o.id === id ? updated : o));

          return {
            fxOffers: updateInList(state.fxOffers),
            shippingOffers: updateInList(state.shippingOffers),
            myOffers: updateInList(state.myOffers),
            currentOffer:
              state.currentOffer?.id === id ? updated : state.currentOffer,
            loadingState: "idle",
          };
        });

        debugLog("OffersStore", "Offer updated:", id);
        return updated;
      } catch (error) {
        errorLog("OffersStore", error, `updateOffer(${id})`);
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
        return null;
      }
    },

    // -------------------------------------------------------------------------
    // DELETE OFFER
    // -------------------------------------------------------------------------

    deleteOffer: async (id) => {
      set({ loadingState: "deleting", error: null });
      debugLog("OffersStore", "Deleting offer:", id);

      try {
        await deleteOffer(id);

        // Remove from all lists
        set((state) => {
          const removeFromList = (offers: MobileOffer[]) =>
            offers.filter((o) => o.id !== id);

          return {
            fxOffers: removeFromList(state.fxOffers),
            shippingOffers: removeFromList(state.shippingOffers),
            myOffers: removeFromList(state.myOffers),
            currentOffer:
              state.currentOffer?.id === id ? null : state.currentOffer,
            loadingState: "idle",
          };
        });

        debugLog("OffersStore", "Offer deleted:", id);
        return true;
      } catch (error) {
        errorLog("OffersStore", error, `deleteOffer(${id})`);
        set({
          loadingState: "idle",
          error: mapToStoreError(error),
        });
        return false;
      }
    },

    // -------------------------------------------------------------------------
    // UTILITY ACTIONS
    // -------------------------------------------------------------------------

    clearError: () => {
      set({ error: null });
    },

    clearCurrentOffer: () => {
      set({ currentOffer: null });
    },

    getOfferById: (id, type) => {
      const { fxOffers, shippingOffers } = get();
      const list = type === "fx" ? fxOffers : shippingOffers;
      return list.find((o) => o.id === id);
    },
  })),
);

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export selectors for convenient imports
export * from "./offersSelectors";
