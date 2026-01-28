/**
 * Offers Store (Zustand)
 *
 * Centralized offers state management with API integration.
 * Handles FX and Shipping offers with backend sync and mock fallback.
 */

import { create } from "zustand";
import {
  listOffers as apiListOffers,
  getOffer as apiGetOffer,
  createOffer as apiCreateOffer,
  updateOffer as apiUpdateOffer,
  deleteOffer as apiDeleteOffer,
  getMyOffers as apiGetMyOffers,
  ApiClientError,
  USE_API,
} from "@/api";
import type {
  Offer as ApiOffer,
  OfferListParams,
  CreateFxOfferRequest,
  CreateShippingOfferRequest,
} from "@/api";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Frontend offer types (mapped from backend).
 */
export type OfferType = "fx" | "shipping";
export type OfferStatus = "active" | "paused" | "completed" | "cancelled";

/**
 * User info in offer.
 */
export interface OfferUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  trustScore: number;
}

/**
 * FX-specific fields.
 */
export interface FxOfferDetails {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  rate: number;
  rateType?: string;
  minAmount: number | null;
  maxAmount?: number | null;
  paymentMethods?: string[];
}

/**
 * Shipping-specific fields.
 */
export interface ShippingOfferDetails {
  origin: {
    city: string | null;
    country: string | null;
  };
  destination: {
    city: string | null;
    country: string | null;
  };
  departureDate: string | null;
  arrivalDate?: string | null;
  maxWeightKg: number;
  pricePerKg: number;
  acceptedItems?: string[];
  restrictedItems?: string[];
}

/**
 * Unified offer model for frontend.
 */
export interface Offer {
  id: string;
  type: OfferType;
  status: OfferStatus;
  title: string | null;
  description?: string | null;
  location: {
    city: string | null;
    country: string | null;
  };
  user: OfferUser;
  fx?: FxOfferDetails;
  shipping?: ShippingOfferDetails;
  viewCount?: number;
  expiresAt?: string | null;
  createdAt: string;
}

/**
 * Offers loading states.
 */
export type OffersLoadingState =
  | "idle"
  | "loading_list"
  | "loading_detail"
  | "creating"
  | "updating"
  | "deleting";

/**
 * Offers store error.
 */
export interface OffersError {
  code: string;
  message: string;
}

/**
 * Offers store state and actions.
 */
export interface OffersState {
  // State
  fxOffers: Offer[];
  shippingOffers: Offer[];
  myOffers: Offer[];
  currentOffer: Offer | null;
  loadingState: OffersLoadingState;
  error: OffersError | null;

  // Pagination
  fxPagination: { page: number; total: number; totalPages: number };
  shippingPagination: { page: number; total: number; totalPages: number };

  // Actions - List
  loadFxOffers: (params?: OfferListParams) => Promise<void>;
  loadShippingOffers: (params?: OfferListParams) => Promise<void>;
  loadMyOffers: () => Promise<void>;
  loadOfferDetail: (id: string) => Promise<Offer | null>;
  refreshOffers: (type: OfferType) => Promise<void>;

  // Actions - CRUD
  createOffer: (
    data: CreateFxOfferRequest | CreateShippingOfferRequest,
  ) => Promise<Offer | null>;
  updateOffer: (
    id: string,
    data: Partial<CreateFxOfferRequest | CreateShippingOfferRequest>,
  ) => Promise<Offer | null>;
  deleteOffer: (id: string) => Promise<boolean>;

  // Utilities
  clearError: () => void;
  clearCurrentOffer: () => void;
  getOfferById: (id: string, type: OfferType) => Offer | undefined;
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

function mapError(error: unknown): OffersError {
  if (error instanceof ApiClientError) {
    return {
      code: error.code,
      message: error.message,
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
  };
}

// ============================================================================
// API RESPONSE MAPPING
// ============================================================================

/**
 * Map backend offer to frontend model.
 */
function mapApiOffer(apiOffer: any): Offer {
  return {
    id: apiOffer.id,
    type: apiOffer.type as OfferType,
    status: apiOffer.status as OfferStatus,
    title: apiOffer.title || null,
    description: apiOffer.description || null,
    location: {
      city: apiOffer.location?.city || null,
      country: apiOffer.location?.country || null,
    },
    user: {
      id: apiOffer.user?.id || "",
      displayName: apiOffer.user?.displayName || null,
      avatarUrl: apiOffer.user?.avatarUrl || null,
      trustScore: apiOffer.user?.trustScore || 0,
    },
    ...(apiOffer.fx && {
      fx: {
        sourceCurrency: apiOffer.fx.sourceCurrency,
        targetCurrency: apiOffer.fx.targetCurrency,
        sourceAmount: apiOffer.fx.sourceAmount,
        rate: apiOffer.fx.rate,
        rateType: apiOffer.fx.rateType,
        minAmount: apiOffer.fx.minAmount,
        maxAmount: apiOffer.fx.maxAmount,
        paymentMethods: apiOffer.fx.paymentMethods,
      },
    }),
    ...(apiOffer.shipping && {
      shipping: {
        origin: apiOffer.shipping.origin,
        destination: apiOffer.shipping.destination,
        departureDate: apiOffer.shipping.departureDate,
        arrivalDate: apiOffer.shipping.arrivalDate,
        maxWeightKg: apiOffer.shipping.maxWeightKg,
        pricePerKg: apiOffer.shipping.pricePerKg,
        acceptedItems: apiOffer.shipping.acceptedItems,
        restrictedItems: apiOffer.shipping.restrictedItems,
      },
    }),
    viewCount: apiOffer.viewCount,
    expiresAt: apiOffer.expiresAt,
    createdAt: apiOffer.createdAt,
  };
}

// ============================================================================
// MOCK DATA (Fallback)
// ============================================================================

const MOCK_FX_OFFERS: Offer[] = [
  {
    id: "fx-mock-1",
    type: "fx",
    status: "active",
    title: "EUR → GNF Exchange",
    location: { city: "Istanbul", country: "TR" },
    user: {
      id: "mock-user-1",
      displayName: "Mamadou Diallo",
      avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      trustScore: 85,
    },
    fx: {
      sourceCurrency: "EUR",
      targetCurrency: "GNF",
      sourceAmount: 500,
      rate: 11000,
      minAmount: 100,
    },
    createdAt: new Date().toISOString(),
  },
];

const MOCK_SHIPPING_OFFERS: Offer[] = [
  {
    id: "ship-mock-1",
    type: "shipping",
    status: "active",
    title: "Colis Turkey → Guinea",
    location: { city: "Istanbul", country: "TR" },
    user: {
      id: "mock-user-1",
      displayName: "Mamadou Diallo",
      avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      trustScore: 85,
    },
    shipping: {
      origin: { city: "Istanbul", country: "TR" },
      destination: { city: "Conakry", country: "GN" },
      departureDate: "2026-02-01",
      maxWeightKg: 30,
      pricePerKg: 15,
    },
    createdAt: new Date().toISOString(),
  },
];

// ============================================================================
// STORE
// ============================================================================

export const useOffersStore = create<OffersState>((set, get) => ({
  // Initial state
  fxOffers: [],
  shippingOffers: [],
  myOffers: [],
  currentOffer: null,
  loadingState: "idle",
  error: null,

  fxPagination: { page: 1, total: 0, totalPages: 0 },
  shippingPagination: { page: 1, total: 0, totalPages: 0 },

  // ---------------------------------------------------------------------------
  // LOAD FX OFFERS
  // ---------------------------------------------------------------------------

  loadFxOffers: async (params?: OfferListParams) => {
    set({ loadingState: "loading_list", error: null });
    console.log("[OffersStore] Loading FX offers...");

    try {
      if (!USE_API) {
        // Mock mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({
          fxOffers: MOCK_FX_OFFERS,
          fxPagination: {
            page: 1,
            total: MOCK_FX_OFFERS.length,
            totalPages: 1,
          },
          loadingState: "idle",
        });
        return;
      }

      const { offers, total, page, totalPages } = await apiListOffers({
        ...params,
        type: "fx",
        status: "active",
      });

      const mappedOffers = offers.map(mapApiOffer);

      set({
        fxOffers: mappedOffers,
        fxPagination: { page, total, totalPages },
        loadingState: "idle",
      });

      console.log("[OffersStore] FX offers loaded:", mappedOffers.length);
    } catch (error) {
      console.error("[OffersStore] Failed to load FX offers:", error);
      set({
        loadingState: "idle",
        error: mapError(error),
        // Fallback to mock on error
        fxOffers: MOCK_FX_OFFERS,
      });
    }
  },

  // ---------------------------------------------------------------------------
  // LOAD SHIPPING OFFERS
  // ---------------------------------------------------------------------------

  loadShippingOffers: async (params?: OfferListParams) => {
    set({ loadingState: "loading_list", error: null });
    console.log("[OffersStore] Loading Shipping offers...");

    try {
      if (!USE_API) {
        // Mock mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({
          shippingOffers: MOCK_SHIPPING_OFFERS,
          shippingPagination: {
            page: 1,
            total: MOCK_SHIPPING_OFFERS.length,
            totalPages: 1,
          },
          loadingState: "idle",
        });
        return;
      }

      const { offers, total, page, totalPages } = await apiListOffers({
        ...params,
        type: "shipping",
        status: "active",
      });

      const mappedOffers = offers.map(mapApiOffer);

      set({
        shippingOffers: mappedOffers,
        shippingPagination: { page, total, totalPages },
        loadingState: "idle",
      });

      console.log("[OffersStore] Shipping offers loaded:", mappedOffers.length);
    } catch (error) {
      console.error("[OffersStore] Failed to load Shipping offers:", error);
      set({
        loadingState: "idle",
        error: mapError(error),
        // Fallback to mock on error
        shippingOffers: MOCK_SHIPPING_OFFERS,
      });
    }
  },

  // ---------------------------------------------------------------------------
  // LOAD MY OFFERS
  // ---------------------------------------------------------------------------

  loadMyOffers: async () => {
    set({ loadingState: "loading_list", error: null });
    console.log("[OffersStore] Loading my offers...");

    try {
      if (!USE_API) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ myOffers: [], loadingState: "idle" });
        return;
      }

      const { offers } = await apiGetMyOffers();
      const mappedOffers = offers.map(mapApiOffer);

      set({
        myOffers: mappedOffers,
        loadingState: "idle",
      });

      console.log("[OffersStore] My offers loaded:", mappedOffers.length);
    } catch (error) {
      console.error("[OffersStore] Failed to load my offers:", error);
      set({
        loadingState: "idle",
        error: mapError(error),
      });
    }
  },

  // ---------------------------------------------------------------------------
  // LOAD OFFER DETAIL
  // ---------------------------------------------------------------------------

  loadOfferDetail: async (id: string): Promise<Offer | null> => {
    set({ loadingState: "loading_detail", error: null });
    console.log("[OffersStore] Loading offer detail:", id);

    try {
      if (!USE_API) {
        // Check mock data
        const { fxOffers, shippingOffers } = get();
        const offer =
          [...fxOffers, ...shippingOffers].find((o) => o.id === id) || null;
        set({ currentOffer: offer, loadingState: "idle" });
        return offer;
      }

      const apiOffer = await apiGetOffer(id);
      const offer = mapApiOffer(apiOffer);

      set({ currentOffer: offer, loadingState: "idle" });
      console.log("[OffersStore] Offer detail loaded:", id);
      return offer;
    } catch (error) {
      console.error("[OffersStore] Failed to load offer detail:", error);
      set({
        loadingState: "idle",
        error: mapError(error),
      });
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // REFRESH OFFERS
  // ---------------------------------------------------------------------------

  refreshOffers: async (type: OfferType) => {
    if (type === "fx") {
      await get().loadFxOffers();
    } else {
      await get().loadShippingOffers();
    }
  },

  // ---------------------------------------------------------------------------
  // CREATE OFFER
  // ---------------------------------------------------------------------------

  createOffer: async (data): Promise<Offer | null> => {
    set({ loadingState: "creating", error: null });
    console.log("[OffersStore] Creating offer:", data.type);

    try {
      if (!USE_API) {
        // Mock creation
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockOffer: Offer = {
          id: `${data.type}-${Date.now()}`,
          type: data.type as OfferType,
          status: "active",
          title: "New Offer",
          location: { city: null, country: null },
          user: {
            id: "current-user",
            displayName: "You",
            avatarUrl: null,
            trustScore: 50,
          },
          createdAt: new Date().toISOString(),
        };
        set({ loadingState: "idle" });
        return mockOffer;
      }

      const apiOffer = await apiCreateOffer(data);
      const offer = mapApiOffer(apiOffer);

      // Add to appropriate list
      if (data.type === "fx") {
        set((state) => ({ fxOffers: [offer, ...state.fxOffers] }));
      } else {
        set((state) => ({ shippingOffers: [offer, ...state.shippingOffers] }));
      }

      set({ loadingState: "idle" });
      console.log("[OffersStore] Offer created:", offer.id);
      return offer;
    } catch (error) {
      console.error("[OffersStore] Failed to create offer:", error);
      set({
        loadingState: "idle",
        error: mapError(error),
      });
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // UPDATE OFFER
  // ---------------------------------------------------------------------------

  updateOffer: async (id, data): Promise<Offer | null> => {
    set({ loadingState: "updating", error: null });
    console.log("[OffersStore] Updating offer:", id);

    try {
      if (!USE_API) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ loadingState: "idle" });
        return null;
      }

      const apiOffer = await apiUpdateOffer(id, data);
      const offer = mapApiOffer(apiOffer);

      // Update in lists
      set((state) => ({
        fxOffers: state.fxOffers.map((o) => (o.id === id ? offer : o)),
        shippingOffers: state.shippingOffers.map((o) =>
          o.id === id ? offer : o,
        ),
        myOffers: state.myOffers.map((o) => (o.id === id ? offer : o)),
        currentOffer:
          state.currentOffer?.id === id ? offer : state.currentOffer,
        loadingState: "idle",
      }));

      console.log("[OffersStore] Offer updated:", id);
      return offer;
    } catch (error) {
      console.error("[OffersStore] Failed to update offer:", error);
      set({
        loadingState: "idle",
        error: mapError(error),
      });
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // DELETE OFFER
  // ---------------------------------------------------------------------------

  deleteOffer: async (id): Promise<boolean> => {
    set({ loadingState: "deleting", error: null });
    console.log("[OffersStore] Deleting offer:", id);

    try {
      if (!USE_API) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ loadingState: "idle" });
        return true;
      }

      await apiDeleteOffer(id);

      // Remove from lists
      set((state) => ({
        fxOffers: state.fxOffers.filter((o) => o.id !== id),
        shippingOffers: state.shippingOffers.filter((o) => o.id !== id),
        myOffers: state.myOffers.filter((o) => o.id !== id),
        currentOffer: state.currentOffer?.id === id ? null : state.currentOffer,
        loadingState: "idle",
      }));

      console.log("[OffersStore] Offer deleted:", id);
      return true;
    } catch (error) {
      console.error("[OffersStore] Failed to delete offer:", error);
      set({
        loadingState: "idle",
        error: mapError(error),
      });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------------

  clearError: () => set({ error: null }),

  clearCurrentOffer: () => set({ currentOffer: null }),

  getOfferById: (id, type) => {
    const { fxOffers, shippingOffers } = get();
    const list = type === "fx" ? fxOffers : shippingOffers;
    return list.find((o) => o.id === id);
  },
}));
