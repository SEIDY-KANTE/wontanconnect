/**
 * Sessions Contracts
 *
 * CRITICAL FIX: Session API has major contract mismatches:
 *
 * CREATE SESSION:
 * - Mobile sends: { offerId, agreedAmount, notes }
 * - Backend expects: { offerId, proposedAmount, message }
 *
 * CONFIRM SESSION:
 * - Mobile sends: { type: 'sent' | 'received' }
 * - Backend expects: { confirmationType: 'sent' | 'received' }
 *
 * RESPONSE FORMAT:
 * - Backend returns: initiator/responder objects, confirmations array
 * - Mobile expects: initiatorId/responderId strings, boolean flags
 */

import { z } from "zod";
import { BackendPaginationSchema } from "./pagination";
import {
  BackendUserBriefSchema,
  adaptUserBrief,
  type MobileUser,
} from "./common";

// ============================================================================
// SESSION STATUS
// ============================================================================

export const SessionStatusSchema = z.enum([
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
]);

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * Mobile-friendly status display mapping
 */
export const SESSION_STATUS_DISPLAY: Record<
  SessionStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "#FFA500" },
  accepted: { label: "Accepted", color: "#4CAF50" },
  in_progress: { label: "In Progress", color: "#2196F3" },
  completed: { label: "Completed", color: "#4CAF50" },
  cancelled: { label: "Cancelled", color: "#9E9E9E" },
  disputed: { label: "Disputed", color: "#F44336" },
};

// ============================================================================
// CONFIRMATION TYPE
// ============================================================================

export const ConfirmationTypeSchema = z.enum(["sent", "received"]);
export type ConfirmationType = z.infer<typeof ConfirmationTypeSchema>;

// ============================================================================
// BACKEND SCHEMAS
// ============================================================================

/**
 * Backend offer summary (embedded in session)
 */
export const BackendSessionOfferSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["fx", "shipping"]),
  title: z.string().nullable().optional(),
  // FX fields (conditional)
  sourceCurrency: z.string().optional(),
  targetCurrency: z.string().optional(),
  sourceAmount: z.number().nullable().optional(),
  rate: z.number().nullable().optional(),
  // Shipping fields (conditional)
  origin: z
    .object({
      city: z.string().nullable(),
      country: z.string().nullable(),
    })
    .optional(),
  destination: z
    .object({
      city: z.string().nullable(),
      country: z.string().nullable(),
    })
    .optional(),
});

export type BackendSessionOffer = z.infer<typeof BackendSessionOfferSchema>;

/**
 * Backend confirmation record
 */
export const BackendConfirmationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: ConfirmationTypeSchema,
  notes: z.string().nullable().optional(),
  confirmedAt: z.string(),
});

export type BackendConfirmation = z.infer<typeof BackendConfirmationSchema>;

/**
 * Backend session response (as returned by API)
 */
export const BackendSessionSchema = z.object({
  id: z.string().uuid(),
  status: SessionStatusSchema,
  offer: BackendSessionOfferSchema,
  initiator: BackendUserBriefSchema,
  responder: BackendUserBriefSchema,
  agreedAmount: z.number().nullable(),
  confirmations: z.array(BackendConfirmationSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BackendSession = z.infer<typeof BackendSessionSchema>;

/**
 * Backend sessions list response
 */
export const BackendSessionsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(BackendSessionSchema),
  pagination: BackendPaginationSchema.optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
  }),
});

export type BackendSessionsListResponse = z.infer<
  typeof BackendSessionsListResponseSchema
>;

// ============================================================================
// MOBILE MODELS
// ============================================================================

/**
 * Mobile session offer (UI-friendly)
 */
export interface MobileSessionOffer {
  id: string;
  type: "fx" | "shipping";
  title: string | null;
  // FX
  sourceCurrency?: string;
  targetCurrency?: string;
  sourceAmount?: number | null;
  rate?: number | null;
  // Shipping
  origin?: { city: string | null; country: string | null };
  destination?: { city: string | null; country: string | null };
}

/**
 * Mobile session model (UI-friendly)
 */
export interface MobileSession {
  id: string;
  status: SessionStatus;
  offer: MobileSessionOffer;
  initiator: MobileUser;
  responder: MobileUser;
  agreedAmount: number | null;
  // Derived from confirmations array for easy UI access
  initiatorConfirmed: boolean;
  responderConfirmed: boolean;
  confirmations: Array<{
    id: string;
    userId: string;
    type: ConfirmationType;
    notes: string | null;
    confirmedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// REQUEST ADAPTERS (Mobile → Backend)
// ============================================================================

/**
 * Mobile create session request (what UI sends)
 */
export interface MobileCreateSessionRequest {
  offerId: string;
  agreedAmount?: number;
  notes?: string;
}

/**
 * Backend create session request (what server expects)
 */
export interface BackendCreateSessionRequest {
  offerId: string;
  proposedAmount?: number;
  message?: string;
}

/**
 * CRITICAL: Adapts mobile create request to backend format
 */
export function adaptCreateSessionRequest(
  mobile: MobileCreateSessionRequest,
): BackendCreateSessionRequest {
  return {
    offerId: mobile.offerId,
    proposedAmount: mobile.agreedAmount,
    message: mobile.notes,
  };
}

/**
 * Mobile confirm session request (what UI sends)
 */
export interface MobileConfirmSessionRequest {
  type: ConfirmationType;
  notes?: string;
}

/**
 * Backend confirm session request (what server expects)
 */
export interface BackendConfirmSessionRequest {
  confirmationType: ConfirmationType;
  notes?: string;
}

/**
 * CRITICAL: Adapts mobile confirm request to backend format
 */
export function adaptConfirmSessionRequest(
  mobile: MobileConfirmSessionRequest,
): BackendConfirmSessionRequest {
  return {
    confirmationType: mobile.type,
    notes: mobile.notes,
  };
}

// ============================================================================
// RESPONSE ADAPTERS (Backend → Mobile)
// ============================================================================

/**
 * Adapts backend session offer to mobile format
 */
function adaptSessionOffer(offer: BackendSessionOffer): MobileSessionOffer {
  return {
    id: offer.id,
    type: offer.type,
    title: offer.title ?? null,
    ...(offer.type === "fx" && {
      sourceCurrency: offer.sourceCurrency,
      targetCurrency: offer.targetCurrency,
      sourceAmount: offer.sourceAmount,
      rate: offer.rate,
    }),
    ...(offer.type === "shipping" && {
      origin: offer.origin,
      destination: offer.destination,
    }),
  };
}

/**
 * CRITICAL: Adapts backend session response to mobile format
 *
 * Key transformations:
 * - Extracts initiator/responder confirmed flags from confirmations array
 * - Converts date strings to Date objects
 * - Maps nested objects to mobile-friendly format
 */
export function adaptSession(session: BackendSession): MobileSession {
  // Derive confirmation flags from the confirmations array
  const initiatorConfirmed = session.confirmations.some(
    (c) => c.userId === session.initiator.id,
  );
  const responderConfirmed = session.confirmations.some(
    (c) => c.userId === session.responder.id,
  );

  return {
    id: session.id,
    status: session.status,
    offer: adaptSessionOffer(session.offer),
    initiator: adaptUserBrief(session.initiator),
    responder: adaptUserBrief(session.responder),
    agreedAmount: session.agreedAmount,
    initiatorConfirmed,
    responderConfirmed,
    confirmations: session.confirmations.map((c) => ({
      id: c.id,
      userId: c.userId,
      type: c.type,
      notes: c.notes ?? null,
      confirmedAt: new Date(c.confirmedAt),
    })),
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  };
}

/**
 * Validates and adapts raw session response
 */
export function validateAndAdaptSession(raw: unknown): MobileSession {
  const validated = BackendSessionSchema.parse(raw);
  return adaptSession(validated);
}

/**
 * Validates and adapts raw sessions list response
 */
export function validateAndAdaptSessionsList(raw: unknown): {
  sessions: MobileSession[];
  pagination: z.infer<typeof BackendPaginationSchema> | undefined;
} {
  const validated = BackendSessionsListResponseSchema.parse(raw);
  return {
    sessions: validated.data.map(adaptSession),
    pagination: validated.pagination,
  };
}

// ============================================================================
// SESSION FILTERS
// ============================================================================

export interface SessionFilters {
  status?: SessionStatus;
  role?: "initiator" | "responder" | "all";
  page?: number;
  limit?: number;
}

/**
 * Converts mobile filters to backend query params
 */
export function adaptSessionFilters(
  filters: SessionFilters,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.status) params.status = filters.status;
  if (filters.role) params.role = filters.role;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);

  return params;
}
