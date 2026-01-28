/**
 * Offers Contracts
 *
 * Offer types and adapters. Backend format is mostly aligned,
 * but we need to handle nested fx/shipping objects properly.
 */

import { z } from "zod";
import { BackendPaginationSchema } from "./pagination";
import {
  BackendUserBriefSchema,
  BackendLocationSchema,
  adaptUserBrief,
  adaptLocation,
  type MobileUser,
  type MobileLocation,
} from "./common";

// ============================================================================
// OFFER TYPES & STATUS
// ============================================================================

export const OfferTypeSchema = z.enum(["fx", "shipping"]);
export type OfferType = z.infer<typeof OfferTypeSchema>;

export const OfferStatusSchema = z.enum([
  "active",
  "paused",
  "completed",
  "cancelled",
]);
export type OfferStatus = z.infer<typeof OfferStatusSchema>;

export const RateTypeSchema = z.enum(["fixed", "negotiable"]);
export type RateType = z.infer<typeof RateTypeSchema>;

// ============================================================================
// BACKEND SCHEMAS
// ============================================================================

/**
 * Backend FX offer data
 */
export const BackendFxOfferSchema = z.object({
  sourceCurrency: z.string(),
  targetCurrency: z.string(),
  sourceAmount: z.number(),
  rate: z.number(),
  rateType: RateTypeSchema.optional(),
  minAmount: z.number().nullable().optional(),
  maxAmount: z.number().nullable().optional(),
  paymentMethods: z.array(z.string()).optional(),
});

export type BackendFxOffer = z.infer<typeof BackendFxOfferSchema>;

/**
 * Backend Shipping offer data
 */
export const BackendShippingOfferSchema = z.object({
  origin: BackendLocationSchema,
  destination: BackendLocationSchema,
  departureDate: z.string().nullable().optional(),
  arrivalDate: z.string().nullable().optional(),
  maxWeightKg: z.number(),
  pricePerKg: z.number(),
  acceptedItems: z.array(z.string()).optional(),
  restrictedItems: z.array(z.string()).optional(),
});

export type BackendShippingOffer = z.infer<typeof BackendShippingOfferSchema>;

/**
 * Backend offer (list item format)
 */
export const BackendOfferListItemSchema = z.object({
  id: z.string().uuid(),
  type: OfferTypeSchema,
  status: OfferStatusSchema,
  title: z.string().nullable().optional(),
  user: BackendUserBriefSchema,
  location: BackendLocationSchema,
  fx: BackendFxOfferSchema.optional(),
  shipping: BackendShippingOfferSchema.optional(),
  createdAt: z.string(),
});

export type BackendOfferListItem = z.infer<typeof BackendOfferListItemSchema>;

/**
 * Backend offer (detail format)
 */
export const BackendOfferDetailSchema = BackendOfferListItemSchema.extend({
  description: z.string().nullable().optional(),
  viewCount: z.number().optional(),
  expiresAt: z.string().nullable().optional(),
});

export type BackendOfferDetail = z.infer<typeof BackendOfferDetailSchema>;

/**
 * Backend offers list response
 */
export const BackendOffersListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(BackendOfferListItemSchema),
  pagination: BackendPaginationSchema.optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
  }),
});

export type BackendOffersListResponse = z.infer<
  typeof BackendOffersListResponseSchema
>;

// ============================================================================
// MOBILE MODELS
// ============================================================================

/**
 * Mobile FX offer details
 */
export interface MobileFxOffer {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  rate: number;
  rateType?: RateType;
  minAmount: number | null;
  maxAmount: number | null;
  paymentMethods?: string[];
}

/**
 * Mobile Shipping offer details
 */
export interface MobileShippingOffer {
  origin: MobileLocation;
  destination: MobileLocation;
  departureDate: string | null;
  arrivalDate: string | null;
  maxWeightKg: number;
  pricePerKg: number;
  acceptedItems?: string[];
  restrictedItems?: string[];
}

/**
 * Mobile offer model (unified for list and detail)
 */
export interface MobileOffer {
  id: string;
  type: OfferType;
  status: OfferStatus;
  title: string | null;
  description?: string | null;
  user: MobileUser;
  location: MobileLocation;
  fx?: MobileFxOffer;
  shipping?: MobileShippingOffer;
  viewCount?: number;
  expiresAt?: Date | null;
  createdAt: Date;
}

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Adapts backend FX offer to mobile format
 */
function adaptFxOffer(fx: BackendFxOffer): MobileFxOffer {
  return {
    sourceCurrency: fx.sourceCurrency,
    targetCurrency: fx.targetCurrency,
    sourceAmount: fx.sourceAmount,
    rate: fx.rate,
    rateType: fx.rateType,
    minAmount: fx.minAmount ?? null,
    maxAmount: fx.maxAmount ?? null,
    paymentMethods: fx.paymentMethods,
  };
}

/**
 * Adapts backend Shipping offer to mobile format
 */
function adaptShippingOffer(
  shipping: BackendShippingOffer,
): MobileShippingOffer {
  return {
    origin: adaptLocation(shipping.origin),
    destination: adaptLocation(shipping.destination),
    departureDate: shipping.departureDate ?? null,
    arrivalDate: shipping.arrivalDate ?? null,
    maxWeightKg: shipping.maxWeightKg,
    pricePerKg: shipping.pricePerKg,
    acceptedItems: shipping.acceptedItems,
    restrictedItems: shipping.restrictedItems,
  };
}

/**
 * Adapts backend offer list item to mobile format
 */
export function adaptOffer(offer: BackendOfferListItem): MobileOffer {
  return {
    id: offer.id,
    type: offer.type,
    status: offer.status,
    title: offer.title ?? null,
    user: adaptUserBrief(offer.user),
    location: adaptLocation(offer.location),
    ...(offer.fx && { fx: adaptFxOffer(offer.fx) }),
    ...(offer.shipping && { shipping: adaptShippingOffer(offer.shipping) }),
    createdAt: new Date(offer.createdAt),
  };
}

/**
 * Adapts backend offer detail to mobile format
 */
export function adaptOfferDetail(offer: BackendOfferDetail): MobileOffer {
  return {
    ...adaptOffer(offer),
    description: offer.description ?? null,
    viewCount: offer.viewCount,
    expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : null,
  };
}

/**
 * Validates and adapts raw offer response
 */
export function validateAndAdaptOffer(raw: unknown): MobileOffer {
  const validated = BackendOfferDetailSchema.parse(raw);
  return adaptOfferDetail(validated);
}

/**
 * Validates and adapts raw offers list response
 */
export function validateAndAdaptOffersList(raw: unknown): {
  offers: MobileOffer[];
  pagination: z.infer<typeof BackendPaginationSchema> | undefined;
} {
  const validated = BackendOffersListResponseSchema.parse(raw);
  return {
    offers: validated.data.map(adaptOffer),
    pagination: validated.pagination,
  };
}

// ============================================================================
// CREATE/UPDATE REQUEST TYPES
// ============================================================================

/**
 * Mobile create FX offer request
 */
export interface MobileCreateFxOfferRequest {
  type: "fx";
  title: string;
  description?: string;
  locationCity: string;
  locationCountry: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  rate: number;
  rateType: RateType;
  minAmount?: number;
  maxAmount?: number;
  paymentMethods?: string[];
  expiresAt?: string;
}

/**
 * Mobile create Shipping offer request
 */
export interface MobileCreateShippingOfferRequest {
  type: "shipping";
  title: string;
  description?: string;
  locationCity: string;
  locationCountry: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  arrivalDate?: string;
  maxWeightKg: number;
  pricePerKg: number;
  acceptedItems?: string[];
  restrictedItems?: string[];
  expiresAt?: string;
}

export type MobileCreateOfferRequest =
  | MobileCreateFxOfferRequest
  | MobileCreateShippingOfferRequest;

// ============================================================================
// OFFER FILTERS
// ============================================================================

export interface OfferFilters {
  type?: OfferType;
  status?: OfferStatus;
  sourceCurrency?: string;
  targetCurrency?: string;
  originCountry?: string;
  destinationCountry?: string;
  page?: number;
  limit?: number;
}

/**
 * Converts mobile filters to backend query params
 */
export function adaptOfferFilters(
  filters: OfferFilters,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.type) params.type = filters.type;
  if (filters.status) params.status = filters.status;
  if (filters.sourceCurrency) params.sourceCurrency = filters.sourceCurrency;
  if (filters.targetCurrency) params.targetCurrency = filters.targetCurrency;
  if (filters.originCountry) params.originCountry = filters.originCountry;
  if (filters.destinationCountry)
    params.destinationCountry = filters.destinationCountry;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);

  return params;
}
