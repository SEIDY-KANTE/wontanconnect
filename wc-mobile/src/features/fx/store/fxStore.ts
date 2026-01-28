/**
 * FX Store (Zustand)
 *
 * Local state management for FX feature with API integration.
 * Fetches from backend API with fallback to mock data.
 */

import { create } from "zustand";
import { FXOffer, FXOfferType } from "../model/types";
import { mockFXOffers, mockUsers } from "../data/mockData";
import {
  listFxOffers as apiListFxOffers,
  getOffer as apiGetOffer,
  createOffer as apiCreateOffer,
  updateOffer as apiUpdateOffer,
  deleteOffer as apiDeleteOffer,
  USE_API,
  ApiClientError,
} from "@/api";

// ============================================================================
// ERROR MAPPING
// ============================================================================

/**
 * Map API error codes to user-friendly messages for FX operations.
 */
function mapFxErrorToUserFriendlyMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const errorMap: Record<string, string> = {
      VALIDATION_ERROR: "Please check all required fields and try again",
      OFFER_NOT_FOUND: "This offer is no longer available",
      OFFER_EXPIRED: "This offer has expired",
      UNAUTHORIZED: "Please log in to continue",
      FORBIDDEN: "You don't have permission to perform this action",
      NETWORK_ERROR: "Unable to connect. Please check your internet connection",
      RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
    };

    return errorMap[error.code] || error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

type FilterType = "all" | FXOfferType;

interface FXState {
  offers: FXOffer[];
  isLoading: boolean;
  filter: FilterType;
  searchQuery: string;
  error: string | null;

  // Actions
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  loadOffers: () => Promise<void>;
  addOffer: (
    offer: Omit<FXOffer, "id" | "createdAt" | "updatedAt" | "user" | "status">,
  ) => Promise<FXOffer | null>;
  updateOffer: (
    id: string,
    updates: Partial<Omit<FXOffer, "id" | "createdAt" | "user">>,
  ) => Promise<boolean>;
  updateOfferStatus: (id: string, status: FXOffer["status"]) => void;
  deleteOffer: (id: string) => Promise<boolean>;
  getOfferById: (id: string) => FXOffer | undefined;
  getFilteredOffers: () => FXOffer[];
  clearError: () => void;
}

/**
 * Map backend API offer to frontend FXOffer model.
 */
function mapApiToFXOffer(apiOffer: any): FXOffer {
  // Determine type based on currency direction (simplified logic)
  // In reality, you might want a dedicated field from the backend
  const offerType: FXOfferType = "selling"; // Default, could be determined by other logic

  return {
    id: apiOffer.id,
    type: offerType,
    fromCurrency: apiOffer.fx?.sourceCurrency || "EUR",
    toCurrency: apiOffer.fx?.targetCurrency || "GNF",
    amountFrom: apiOffer.fx?.sourceAmount || 0,
    amountTo:
      apiOffer.fx?.sourceAmount && apiOffer.fx?.rate
        ? apiOffer.fx.sourceAmount * apiOffer.fx.rate
        : undefined,
    rate: apiOffer.fx?.rate,
    description: apiOffer.description || apiOffer.title || "",
    location: {
      country: apiOffer.location?.country || "",
      city: apiOffer.location?.city || "",
    },
    user: {
      id: apiOffer.user?.id || "",
      name: apiOffer.user?.displayName || "Unknown",
      avatar: apiOffer.user?.avatarUrl || undefined,
      country: apiOffer.location?.country || "",
      city: apiOffer.location?.city || "",
      isVerified: (apiOffer.user?.trustScore || 0) >= 50,
      rating: (apiOffer.user?.trustScore || 0) / 20, // Convert 0-100 to 0-5 scale
      totalDeals: 0, // Not available in list response
    },
    status: apiOffer.status || "active",
    createdAt: apiOffer.createdAt,
    updatedAt: apiOffer.createdAt, // API doesn't return updatedAt in list
  };
}

export const useFXStore = create<FXState>((set, get) => ({
  offers: [],
  isLoading: false,
  filter: "all",
  searchQuery: "",
  error: null,

  setFilter: (filter) => set({ filter }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearError: () => set({ error: null }),

  loadOffers: async () => {
    set({ isLoading: true, error: null });
    console.log("[FXStore] Loading offers...");

    try {
      if (!USE_API) {
        // Mock mode - use local data
        await new Promise((resolve) => setTimeout(resolve, 800));
        set({ offers: mockFXOffers, isLoading: false });
        console.log("[FXStore] Mock offers loaded:", mockFXOffers.length);
        return;
      }

      // API mode
      const { offers: apiOffers } = await apiListFxOffers({ status: "active" });
      const mappedOffers = apiOffers.map(mapApiToFXOffer);

      set({ offers: mappedOffers, isLoading: false });
      console.log("[FXStore] API offers loaded:", mappedOffers.length);
    } catch (error: any) {
      console.error("[FXStore] Failed to load offers:", error);
      // Fallback to mock data on error
      set({
        offers: mockFXOffers,
        isLoading: false,
        error: error.message || "Failed to load offers",
      });
    }
  },

  addOffer: async (offerData) => {
    console.log("[FXStore] Creating offer...");

    try {
      if (!USE_API) {
        // Mock mode
        const newOffer: FXOffer = {
          ...offerData,
          id: `fx-${Date.now()}`,
          user: mockUsers[0],
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ offers: [newOffer, ...state.offers] }));
        console.log("[FXStore] Mock offer created:", newOffer.id);
        return newOffer;
      }

      // API mode
      const apiOffer = await apiCreateOffer({
        type: "fx",
        title:
          offerData.description ||
          `${offerData.fromCurrency} → ${offerData.toCurrency}`,
        description: offerData.description,
        locationCity: offerData.location.city,
        locationCountry: offerData.location.country,
        sourceCurrency: offerData.fromCurrency,
        targetCurrency: offerData.toCurrency,
        sourceAmount: offerData.amountFrom,
        rate: offerData.rate, // Rate is optional - don't default to 1
        rateType: "negotiable",
      });

      const newOffer = mapApiToFXOffer(apiOffer);
      set((state) => ({ offers: [newOffer, ...state.offers] }));
      console.log("[FXStore] API offer created:", newOffer.id);
      return newOffer;
    } catch (error: any) {
      console.error("[FXStore] Failed to create offer:", error);
      set({ error: mapFxErrorToUserFriendlyMessage(error) });
      return null;
    }
  },

  updateOffer: async (id, updates) => {
    console.log("[FXStore] Updating offer:", id);

    try {
      if (!USE_API) {
        // Mock mode
        set((state) => ({
          offers: state.offers.map((offer) =>
            offer.id === id
              ? { ...offer, ...updates, updatedAt: new Date().toISOString() }
              : offer,
          ),
        }));
        return true;
      }

      // API mode - only include fields that the API accepts
      const apiPayload: Partial<{
        description: string;
        sourceCurrency: string;
        targetCurrency: string;
        sourceAmount: number;
        rate: number;
      }> = {};

      if (updates.description !== undefined)
        apiPayload.description = updates.description;
      if (updates.fromCurrency !== undefined)
        apiPayload.sourceCurrency = updates.fromCurrency;
      if (updates.toCurrency !== undefined)
        apiPayload.targetCurrency = updates.toCurrency;
      if (updates.amountFrom !== undefined)
        apiPayload.sourceAmount = updates.amountFrom;
      if (updates.rate !== undefined) apiPayload.rate = updates.rate;

      await apiUpdateOffer(id, apiPayload);

      // Reload offers to get fresh data
      await get().loadOffers();
      console.log("[FXStore] Offer updated:", id);
      return true;
    } catch (error: any) {
      console.error("[FXStore] Failed to update offer:", error);
      set({ error: mapFxErrorToUserFriendlyMessage(error) });
      return false;
    }
  },

  updateOfferStatus: (id, status) => {
    get().updateOffer(id, { status });
  },

  deleteOffer: async (id) => {
    console.log("[FXStore] Deleting offer:", id);

    try {
      if (!USE_API) {
        // Mock mode
        set((state) => ({
          offers: state.offers.filter((offer) => offer.id !== id),
        }));
        return true;
      }

      // API mode
      await apiDeleteOffer(id);
      set((state) => ({
        offers: state.offers.filter((offer) => offer.id !== id),
      }));
      console.log("[FXStore] Offer deleted:", id);
      return true;
    } catch (error: any) {
      console.error("[FXStore] Failed to delete offer:", error);
      set({ error: error.message || "Failed to delete offer" });
      return false;
    }
  },

  getOfferById: (id) => {
    return get().offers.find((offer) => offer.id === id);
  },

  getFilteredOffers: () => {
    const { offers, filter, searchQuery } = get();

    let filtered = [...offers];

    // Filter by type
    if (filter !== "all") {
      filtered = filtered.filter((offer) => offer.type === filter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (offer) =>
          offer.fromCurrency.toLowerCase().includes(query) ||
          offer.toCurrency.toLowerCase().includes(query) ||
          offer.location.city.toLowerCase().includes(query) ||
          offer.user.name.toLowerCase().includes(query),
      );
    }

    return filtered;
  },
}));
