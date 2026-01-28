/**
 * Sessions API
 *
 * API endpoints for exchange sessions with proper contract alignment.
 *
 * CRITICAL FIXES APPLIED:
 * - Create session: agreedAmount/notes → proposedAmount/message
 * - Confirm session: type → confirmationType
 * - Response mapping with validation
 */

import { apiClient } from "./client";
import { SESSIONS_ENDPOINTS } from "./endpoints";
import { config, debugLog, errorLog } from "@/config";
import {
  // Request adapters
  adaptCreateSessionRequest,
  adaptConfirmSessionRequest,
  adaptSessionFilters,
  // Response adapters
  adaptSession,
  validateAndAdaptSession,
  // Response schema
  BackendSessionSchema,
  BackendSessionsListResponseSchema,
  // Types
  type MobileSession,
  type MobileCreateSessionRequest,
  type MobileConfirmSessionRequest,
  type SessionFilters,
  type SessionStatus,
} from "./contracts";
import {
  adaptBackendPagination,
  type MobilePaginationMeta,
} from "./contracts/pagination";
import { AppError, ErrorCode } from "./contracts/common";

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SessionsListResponse {
  sessions: MobileSession[];
  meta: MobilePaginationMeta;
}

export interface SessionResponse {
  session: MobileSession;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function handleSessionError(error: unknown, context: string): never {
  errorLog("SessionsAPI", error, context);

  if (error instanceof AppError) {
    throw error;
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    throw new AppError(
      "Invalid session data received from server",
      ErrorCode.INVALID_RESPONSE,
      { details: error },
    );
  }

  // Re-throw other errors
  throw error;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * List sessions with optional filters.
 * Properly handles backend pagination format.
 */
export async function listSessions(
  filters?: SessionFilters,
): Promise<SessionsListResponse> {
  debugLog("SessionsAPI", "Listing sessions with filters:", filters);

  try {
    const params = filters ? adaptSessionFilters(filters) : undefined;
    const response = await apiClient.get(SESSIONS_ENDPOINTS.LIST, { params });

    // Validate and transform response
    const validated = BackendSessionsListResponseSchema.parse(response.data);

    const sessions = validated.data.map(adaptSession);
    const meta = adaptBackendPagination(validated.pagination);

    debugLog("SessionsAPI", `Fetched ${sessions.length} sessions`);

    return { sessions, meta };
  } catch (error) {
    handleSessionError(error, "listSessions");
  }
}

/**
 * Get a single session by ID.
 */
export async function getSession(id: string): Promise<SessionResponse> {
  debugLog("SessionsAPI", "Fetching session:", id);

  try {
    const response = await apiClient.get(SESSIONS_ENDPOINTS.GET(id));

    // Validate response structure
    const validated = BackendSessionSchema.parse(response.data.data);
    const session = adaptSession(validated);

    debugLog("SessionsAPI", "Session fetched:", id);

    return { session };
  } catch (error) {
    handleSessionError(error, `getSession(${id})`);
  }
}

/**
 * Create a new exchange session.
 *
 * CRITICAL: Transforms mobile request format to backend format:
 * - agreedAmount → proposedAmount
 * - notes → message
 */
export async function createSession(
  data: MobileCreateSessionRequest,
): Promise<SessionResponse> {
  debugLog("SessionsAPI", "Creating session for offer:", data.offerId);

  try {
    // CRITICAL: Transform request to backend format
    const backendData = adaptCreateSessionRequest(data);

    debugLog("SessionsAPI", "Transformed request:", backendData);

    const response = await apiClient.post(
      SESSIONS_ENDPOINTS.CREATE,
      backendData,
    );

    // Validate and transform response
    const validated = BackendSessionSchema.parse(response.data.data);
    const session = adaptSession(validated);

    debugLog("SessionsAPI", "Session created:", session.id);

    return { session };
  } catch (error) {
    handleSessionError(error, "createSession");
  }
}

/**
 * Accept a pending session request.
 */
export async function acceptSession(
  id: string,
  acceptedAmount?: number,
): Promise<SessionResponse> {
  debugLog("SessionsAPI", "Accepting session:", id);

  try {
    const body = acceptedAmount !== undefined ? { acceptedAmount } : undefined;
    const response = await apiClient.post(SESSIONS_ENDPOINTS.ACCEPT(id), body);

    const validated = BackendSessionSchema.parse(response.data.data);
    const session = adaptSession(validated);

    debugLog("SessionsAPI", "Session accepted:", id);

    return { session };
  } catch (error) {
    handleSessionError(error, `acceptSession(${id})`);
  }
}

/**
 * Decline a pending session request.
 */
export async function declineSession(
  id: string,
  reason?: string,
): Promise<SessionResponse> {
  debugLog("SessionsAPI", "Declining session:", id);

  try {
    const body = reason ? { reason } : undefined;
    const response = await apiClient.post(SESSIONS_ENDPOINTS.DECLINE(id), body);

    const validated = BackendSessionSchema.parse(response.data.data);
    const session = adaptSession(validated);

    debugLog("SessionsAPI", "Session declined:", id);

    return { session };
  } catch (error) {
    handleSessionError(error, `declineSession(${id})`);
  }
}

/**
 * Cancel an active session.
 */
export async function cancelSession(
  id: string,
  reason?: string,
): Promise<SessionResponse> {
  debugLog("SessionsAPI", "Cancelling session:", id);

  try {
    const body = reason ? { reason } : undefined;
    const response = await apiClient.post(SESSIONS_ENDPOINTS.CANCEL(id), body);

    const validated = BackendSessionSchema.parse(response.data.data);
    const session = adaptSession(validated);

    debugLog("SessionsAPI", "Session cancelled:", id);

    return { session };
  } catch (error) {
    handleSessionError(error, `cancelSession(${id})`);
  }
}

/**
 * Confirm sent or received for a session.
 *
 * CRITICAL: Transforms mobile request format to backend format:
 * - type → confirmationType
 */
export async function confirmSession(
  id: string,
  data: MobileConfirmSessionRequest,
): Promise<SessionResponse> {
  debugLog("SessionsAPI", "Confirming session:", id, "type:", data.type);

  try {
    // CRITICAL: Transform request to backend format
    const backendData = adaptConfirmSessionRequest(data);

    debugLog("SessionsAPI", "Transformed confirm request:", backendData);

    const response = await apiClient.post(
      SESSIONS_ENDPOINTS.CONFIRM(id),
      backendData,
    );

    const validated = BackendSessionSchema.parse(response.data.data);
    const session = adaptSession(validated);

    debugLog("SessionsAPI", "Session confirmed:", id);

    return { session };
  } catch (error) {
    handleSessionError(error, `confirmSession(${id})`);
  }
}

/**
 * Get sessions by status (convenience method)
 */
export async function getSessionsByStatus(
  status: SessionStatus,
  page?: number,
): Promise<SessionsListResponse> {
  return listSessions({ status, page });
}

/**
 * Get pending sessions (convenience method)
 */
export async function getPendingSessions(): Promise<SessionsListResponse> {
  return getSessionsByStatus("pending");
}

/**
 * Get active sessions (in_progress) (convenience method)
 */
export async function getActiveSessions(): Promise<SessionsListResponse> {
  return getSessionsByStatus("in_progress");
}

/**
 * Get completed sessions (convenience method)
 */
export async function getCompletedSessions(
  page?: number,
): Promise<SessionsListResponse> {
  return getSessionsByStatus("completed", page);
}
