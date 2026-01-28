/**
 * Offers API
 *
 * API endpoints for listing, creating, updating, and deleting offers.
 * Properly handles backend response format with pagination in correct location.
 */

import { apiClient } from "./client";
import { OFFERS_ENDPOINTS } from "./endpoints";
import { config, debugLog, errorLog } from "@/config";
import {
  // Adapters
  adaptOffer,
  adaptOfferDetail,
  adaptOfferFilters,
  // Schemas
  BackendOfferListItemSchema,
  BackendOfferDetailSchema,
  BackendOffersListResponseSchema,
  // Types
  type MobileOffer,
  type MobileCreateOfferRequest,
  type OfferFilters,
  type OfferType,
  type OfferStatus,
} from "./contracts/offers";
import {
  adaptBackendPagination,
  type MobilePaginationMeta,
} from "./contracts/pagination";
import { AppError, ErrorCode } from "./contracts/common";

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface OffersListResponse {
  offers: MobileOffer[];
  meta: MobilePaginationMeta;
}

export interface OfferResponse {
  offer: MobileOffer;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function handleOfferError(error: unknown, context: string): never {
  errorLog("OffersAPI", error, context);

  if (error instanceof AppError) {
    throw error;
  }

  if (error && typeof error === "object" && "issues" in error) {
    throw new AppError(
      "Invalid offer data received from server",
      ErrorCode.INVALID_RESPONSE,
      { details: error },
    );
  }

  throw error;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * List offers with optional filters.
 * Properly handles backend pagination format.
 */
export async function listOffers(
  filters?: OfferFilters,
): Promise<OffersListResponse> {
  debugLog("OffersAPI", "Listing offers with filters:", filters);

  try {
    const params = filters ? adaptOfferFilters(filters) : undefined;
    const response = await apiClient.get(OFFERS_ENDPOINTS.LIST, { params });

    // Validate and transform response
    const validated = BackendOffersListResponseSchema.parse(response.data);

    const offers = validated.data.map(adaptOffer);
    const meta = adaptBackendPagination(validated.pagination);

    debugLog("OffersAPI", `Fetched ${offers.length} offers`);

    return { offers, meta };
  } catch (error) {
    handleOfferError(error, "listOffers");
  }
}

/**
 * Get FX offers.
 */
export async function listFxOffers(
  filters?: Omit<OfferFilters, "type">,
): Promise<OffersListResponse> {
  return listOffers({ ...filters, type: "fx" });
}

/**
 * Get Shipping offers.
 */
export async function listShippingOffers(
  filters?: Omit<OfferFilters, "type">,
): Promise<OffersListResponse> {
  return listOffers({ ...filters, type: "shipping" });
}

/**
 * Get active offers.
 */
export async function listActiveOffers(
  filters?: Omit<OfferFilters, "status">,
): Promise<OffersListResponse> {
  return listOffers({ ...filters, status: "active" });
}

/**
 * Get a single offer by ID.
 */
export async function getOffer(id: string): Promise<OfferResponse> {
  debugLog("OffersAPI", "Fetching offer:", id);

  try {
    const response = await apiClient.get(OFFERS_ENDPOINTS.GET(id));

    // Detail response may have additional fields
    const validated = BackendOfferDetailSchema.parse(response.data.data);
    const offer = adaptOfferDetail(validated);

    debugLog("OffersAPI", "Offer fetched:", id);

    return { offer };
  } catch (error) {
    handleOfferError(error, `getOffer(${id})`);
  }
}

/**
 * Create a new offer.
 */
export async function createOffer(
  data: MobileCreateOfferRequest,
): Promise<OfferResponse> {
  debugLog("OffersAPI", "Creating offer:", data.type);

  try {
    const response = await apiClient.post(OFFERS_ENDPOINTS.CREATE, data);

    const validated = BackendOfferDetailSchema.parse(response.data.data);
    const offer = adaptOfferDetail(validated);

    debugLog("OffersAPI", "Offer created:", offer.id);

    return { offer };
  } catch (error) {
    handleOfferError(error, "createOffer");
  }
}

/**
 * Update an existing offer.
 */
export async function updateOffer(
  id: string,
  data: Partial<MobileCreateOfferRequest>,
): Promise<OfferResponse> {
  debugLog("OffersAPI", "Updating offer:", id);

  try {
    const response = await apiClient.patch(OFFERS_ENDPOINTS.UPDATE(id), data);

    const validated = BackendOfferDetailSchema.parse(response.data.data);
    const offer = adaptOfferDetail(validated);

    debugLog("OffersAPI", "Offer updated:", id);

    return { offer };
  } catch (error) {
    handleOfferError(error, `updateOffer(${id})`);
  }
}

/**
 * Delete (deactivate) an offer.
 */
export async function deleteOffer(id: string): Promise<void> {
  debugLog("OffersAPI", "Deleting offer:", id);

  try {
    await apiClient.delete(OFFERS_ENDPOINTS.DELETE(id));
    debugLog("OffersAPI", "Offer deleted:", id);
  } catch (error) {
    handleOfferError(error, `deleteOffer(${id})`);
  }
}

/**
 * Get current user's offers.
 */
export async function getMyOffers(
  filters?: Omit<OfferFilters, "type">,
): Promise<OffersListResponse> {
  debugLog("OffersAPI", "Fetching my offers");

  try {
    const params = filters ? adaptOfferFilters(filters) : undefined;
    const response = await apiClient.get(OFFERS_ENDPOINTS.MY_OFFERS, {
      params,
    });

    const validated = BackendOffersListResponseSchema.parse(response.data);

    const offers = validated.data.map(adaptOffer);
    const meta = adaptBackendPagination(validated.pagination);

    debugLog("OffersAPI", `Fetched ${offers.length} of my offers`);

    return { offers, meta };
  } catch (error) {
    handleOfferError(error, "getMyOffers");
  }
}

/**
 * Pause an offer (change status to paused).
 */
export async function pauseOffer(id: string): Promise<OfferResponse> {
  return updateOffer(id, { status: "paused" } as any);
}

/**
 * Resume a paused offer (change status to active).
 */
export async function resumeOffer(id: string): Promise<OfferResponse> {
  return updateOffer(id, { status: "active" } as any);
}
