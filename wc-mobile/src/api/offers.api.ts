/**
 * Offers API
 *
 * API endpoints for listing, creating, updating, and deleting offers.
 */

import { apiClient } from "./client";
import { OFFERS_ENDPOINTS } from "./endpoints";
import type {
  ApiResponse,
  Offer,
  OfferListParams,
  CreateOfferRequest,
} from "./types";

// ============================================================================
// OFFERS API FUNCTIONS
// ============================================================================

/**
 * List offers with optional filters.
 */
export async function listOffers(
  params?: OfferListParams,
): Promise<{
  offers: Offer[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    console.log("[OffersAPI] Listing offers with params:", params);

    const response = await apiClient.get<
      ApiResponse<Offer[]> & {
        meta: { total: number; page: number; totalPages: number };
      }
    >(OFFERS_ENDPOINTS.LIST, { params });

    const { data, meta } = response.data;

    console.log("[OffersAPI] Fetched", data.length, "offers");
    return {
      offers: data,
      total: meta.total,
      page: meta.page,
      totalPages: meta.totalPages,
    };
  } catch (error) {
    console.error("[OffersAPI] Failed to list offers:", error);
    throw error;
  }
}

/**
 * Get FX offers.
 */
export async function listFxOffers(
  params?: Omit<OfferListParams, "type">,
): Promise<{
  offers: Offer[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return listOffers({ ...params, type: "fx" });
}

/**
 * Get Shipping offers.
 */
export async function listShippingOffers(
  params?: Omit<OfferListParams, "type">,
): Promise<{
  offers: Offer[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return listOffers({ ...params, type: "shipping" });
}

/**
 * Get a single offer by ID.
 */
export async function getOffer(id: string): Promise<Offer> {
  try {
    console.log("[OffersAPI] Fetching offer:", id);

    const response = await apiClient.get<ApiResponse<Offer>>(
      OFFERS_ENDPOINTS.GET(id),
    );

    console.log("[OffersAPI] Offer fetched:", id);
    return response.data.data;
  } catch (error) {
    console.error("[OffersAPI] Failed to fetch offer:", error);
    throw error;
  }
}

/**
 * Create a new offer.
 */
export async function createOffer(data: CreateOfferRequest): Promise<Offer> {
  try {
    console.log("[OffersAPI] Creating offer:", data.type);

    const response = await apiClient.post<ApiResponse<Offer>>(
      OFFERS_ENDPOINTS.CREATE,
      data,
    );

    console.log("[OffersAPI] Offer created:", response.data.data.id);
    return response.data.data;
  } catch (error) {
    console.error("[OffersAPI] Failed to create offer:", error);
    throw error;
  }
}

/**
 * Update an existing offer.
 */
export async function updateOffer(
  id: string,
  data: Partial<CreateOfferRequest>,
): Promise<Offer> {
  try {
    console.log("[OffersAPI] Updating offer:", id);

    const response = await apiClient.patch<ApiResponse<Offer>>(
      OFFERS_ENDPOINTS.UPDATE(id),
      data,
    );

    console.log("[OffersAPI] Offer updated:", id);
    return response.data.data;
  } catch (error) {
    console.error("[OffersAPI] Failed to update offer:", error);
    throw error;
  }
}

/**
 * Delete (deactivate) an offer.
 */
export async function deleteOffer(id: string): Promise<void> {
  try {
    console.log("[OffersAPI] Deleting offer:", id);

    await apiClient.delete(OFFERS_ENDPOINTS.DELETE(id));

    console.log("[OffersAPI] Offer deleted:", id);
  } catch (error) {
    console.error("[OffersAPI] Failed to delete offer:", error);
    throw error;
  }
}

/**
 * Get current user's offers.
 */
export async function getMyOffers(
  params?: Omit<OfferListParams, "type">,
): Promise<{
  offers: Offer[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    console.log("[OffersAPI] Fetching my offers");

    const response = await apiClient.get<
      ApiResponse<Offer[]> & {
        meta: { total: number; page: number; totalPages: number };
      }
    >(OFFERS_ENDPOINTS.MY_OFFERS, { params });

    const { data, meta } = response.data;

    console.log("[OffersAPI] Fetched", data.length, "of my offers");
    return {
      offers: data,
      total: meta.total,
      page: meta.page,
      totalPages: meta.totalPages,
    };
  } catch (error) {
    console.error("[OffersAPI] Failed to fetch my offers:", error);
    throw error;
  }
}
