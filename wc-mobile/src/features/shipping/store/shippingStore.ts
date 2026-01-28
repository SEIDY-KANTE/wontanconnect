/**
 * Shipping Store (Zustand)
 *
 * Local state management for Shipping feature with API integration.
 * Fetches from backend API with fallback to mock data.
 */

import { create } from "zustand";
import { ShippingOffer, ShippingType } from "../model/types";
import { mockShippingOffers, mockUsers } from "../data/mockData";
import {
  listShippingOffers as apiListShippingOffers,
  getOffer as apiGetOffer,
  createOffer as apiCreateOffer,
  updateOffer as apiUpdateOffer,
  deleteOffer as apiDeleteOffer,
  USE_API,
} from "@/api";

type FilterType = "all" | ShippingType;

interface ShippingState {
  offers: ShippingOffer[];
  isLoading: boolean;
  filter: FilterType;
  searchQuery: string;
  error: string | null;

  // Actions
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  loadOffers: () => Promise<void>;
  addOffer: (
    offer: Omit<
      ShippingOffer,
      "id" | "createdAt" | "updatedAt" | "user" | "status"
    >,
  ) => Promise<ShippingOffer | null>;
  updateOffer: (
    id: string,
    updates: Partial<Omit<ShippingOffer, "id" | "createdAt" | "user">>,
  ) => Promise<boolean>;
  updateOfferStatus: (id: string, status: ShippingOffer["status"]) => void;
  deleteOffer: (id: string) => Promise<boolean>;
  getOfferById: (id: string) => ShippingOffer | undefined;
  getFilteredOffers: () => ShippingOffer[];
  clearError: () => void;
}

/**
 * Map backend API offer to frontend ShippingOffer model.
 */
function mapApiToShippingOffer(apiOffer: any): ShippingOffer {
  // Map backend shipping type to frontend type
  const typeMap: Record<string, ShippingType> = {
    traveler_small: "parcel",
    traveler_large: "parcel",
    gp_container: "container",
    shipping: "container",
    vehicle: "vehicle",
  };

  // API returns nested origin/destination objects
  const origin = apiOffer.shipping?.origin || {};
  const destination = apiOffer.shipping?.destination || {};

  return {
    id: apiOffer.id,
    type: typeMap[apiOffer.shipping?.shipmentType] || "parcel",
    fromCity: origin.city || "",
    fromCountry: origin.country || "",
    toCity: destination.city || "",
    toCountry: destination.country || "",
    departureDate: apiOffer.shipping?.departureDate || apiOffer.createdAt,
    capacity: apiOffer.shipping?.maxWeightKg
      ? `${apiOffer.shipping.maxWeightKg}kg`
      : undefined,
    price: apiOffer.shipping?.pricePerKg
      ? `${apiOffer.shipping.pricePerKg} GNF/kg`
      : undefined,
    description: apiOffer.description || apiOffer.title || "",
    user: {
      id: apiOffer.user?.id || "",
      name: apiOffer.user?.displayName || "Unknown",
      avatar: apiOffer.user?.avatarUrl || undefined,
      country: origin.country || "",
      city: origin.city || "",
      isVerified: (apiOffer.user?.trustScore || 0) >= 50,
      rating: (apiOffer.user?.trustScore || 0) / 20, // Convert 0-100 to 0-5 scale
      totalDeals: 0, // Not available in list response
    },
    status: apiOffer.status || "active",
    createdAt: apiOffer.createdAt,
    updatedAt: apiOffer.createdAt, // API doesn't return updatedAt in list
  };
}

export const useShippingStore = create<ShippingState>((set, get) => ({
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
    console.log("[ShippingStore] Loading offers...");

    try {
      if (!USE_API) {
        // Mock mode - use local data
        await new Promise((resolve) => setTimeout(resolve, 800));
        set({ offers: mockShippingOffers, isLoading: false });
        console.log(
          "[ShippingStore] Mock offers loaded:",
          mockShippingOffers.length,
        );
        return;
      }

      // API mode
      const { offers: apiOffers } = await apiListShippingOffers({
        status: "active",
      });
      const mappedOffers = apiOffers.map(mapApiToShippingOffer);

      set({ offers: mappedOffers, isLoading: false });
      console.log("[ShippingStore] API offers loaded:", mappedOffers.length);
    } catch (error: any) {
      console.error("[ShippingStore] Failed to load offers:", error);
      // Fallback to mock data on error
      set({
        offers: mockShippingOffers,
        isLoading: false,
        error: error.message || "Failed to load offers",
      });
    }
  },

  addOffer: async (offerData) => {
    console.log("[ShippingStore] Creating offer...");

    try {
      if (!USE_API) {
        // Mock mode
        const newOffer: ShippingOffer = {
          ...offerData,
          id: `sh-${Date.now()}`,
          user: mockUsers[0],
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ offers: [newOffer, ...state.offers] }));
        console.log("[ShippingStore] Mock offer created:", newOffer.id);
        return newOffer;
      }

      // Map frontend type to backend type - no longer needed, using standard schema

      // API mode
      const apiOffer = await apiCreateOffer({
        type: "shipping",
        title:
          offerData.description ||
          `${offerData.fromCity} → ${offerData.toCity}`,
        description: offerData.description || "",
        locationCity: offerData.fromCity,
        locationCountry: offerData.fromCountry,
        originCity: offerData.fromCity,
        originCountry: offerData.fromCountry,
        destinationCity: offerData.toCity,
        destinationCountry: offerData.toCountry,
        departureDate: offerData.departureDate,
        maxWeightKg: offerData.capacity ? parseFloat(offerData.capacity) : 10,
        pricePerKg: offerData.price ? parseFloat(offerData.price) : 1,
      });

      const newOffer = mapApiToShippingOffer(apiOffer);
      set((state) => ({ offers: [newOffer, ...state.offers] }));
      console.log("[ShippingStore] API offer created:", newOffer.id);
      return newOffer;
    } catch (error: any) {
      console.error("[ShippingStore] Failed to create offer:", error);
      set({ error: error.message || "Failed to create offer" });
      return null;
    }
  },

  updateOffer: async (id, updates) => {
    console.log("[ShippingStore] Updating offer:", id);

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
        originCity: string;
        originCountry: string;
        destinationCity: string;
        destinationCountry: string;
        departureDate: string;
        maxWeightKg: number;
        pricePerKg: number;
      }> = {};

      if (updates.description !== undefined)
        apiPayload.description = updates.description;
      if (updates.fromCity !== undefined)
        apiPayload.originCity = updates.fromCity;
      if (updates.fromCountry !== undefined)
        apiPayload.originCountry = updates.fromCountry;
      if (updates.toCity !== undefined)
        apiPayload.destinationCity = updates.toCity;
      if (updates.toCountry !== undefined)
        apiPayload.destinationCountry = updates.toCountry;
      if (updates.departureDate !== undefined)
        apiPayload.departureDate = updates.departureDate;
      if (updates.capacity !== undefined)
        apiPayload.maxWeightKg = parseFloat(updates.capacity);
      if (updates.price !== undefined)
        apiPayload.pricePerKg = parseFloat(updates.price);

      await apiUpdateOffer(id, apiPayload);

      // Reload offers to get fresh data
      await get().loadOffers();
      console.log("[ShippingStore] Offer updated:", id);
      return true;
    } catch (error: any) {
      console.error("[ShippingStore] Failed to update offer:", error);
      set({ error: error.message || "Failed to update offer" });
      return false;
    }
  },

  updateOfferStatus: (id, status) => {
    get().updateOffer(id, { status });
  },

  deleteOffer: async (id) => {
    console.log("[ShippingStore] Deleting offer:", id);

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
      console.log("[ShippingStore] Offer deleted:", id);
      return true;
    } catch (error: any) {
      console.error("[ShippingStore] Failed to delete offer:", error);
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
          offer.fromCity.toLowerCase().includes(query) ||
          offer.toCity.toLowerCase().includes(query) ||
          offer.user.name.toLowerCase().includes(query),
      );
    }

    return filtered;
  },
}));
