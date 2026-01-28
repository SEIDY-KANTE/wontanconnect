/**
 * Sessions API
 *
 * API endpoints for exchange sessions (create, list, accept, decline, confirm).
 */

import { apiClient } from "./client";
import { SESSIONS_ENDPOINTS } from "./endpoints";
import type {
  ApiResponse,
  Session,
  SessionListParams,
  CreateSessionRequest,
  ConfirmationType,
} from "./types";

// ============================================================================
// SESSIONS API FUNCTIONS
// ============================================================================

/**
 * List sessions with optional filters.
 */
export async function listSessions(
  params?: SessionListParams,
): Promise<{
  sessions: Session[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    console.log("[SessionsAPI] Listing sessions with params:", params);

    const response = await apiClient.get<
      ApiResponse<Session[]> & {
        meta: { total: number; page: number; totalPages: number };
      }
    >(SESSIONS_ENDPOINTS.LIST, { params });

    const { data, meta } = response.data;

    console.log("[SessionsAPI] Fetched", data.length, "sessions");
    return {
      sessions: data,
      total: meta.total,
      page: meta.page,
      totalPages: meta.totalPages,
    };
  } catch (error) {
    console.error("[SessionsAPI] Failed to list sessions:", error);
    throw error;
  }
}

/**
 * Get a single session by ID.
 */
export async function getSession(id: string): Promise<Session> {
  try {
    console.log("[SessionsAPI] Fetching session:", id);

    const response = await apiClient.get<ApiResponse<Session>>(
      SESSIONS_ENDPOINTS.GET(id),
    );

    console.log("[SessionsAPI] Session fetched:", id);
    return response.data.data;
  } catch (error) {
    console.error("[SessionsAPI] Failed to fetch session:", error);
    throw error;
  }
}

/**
 * Create a new exchange session.
 */
export async function createSession(
  data: CreateSessionRequest,
): Promise<Session> {
  try {
    console.log("[SessionsAPI] Creating session for offer:", data.offerId);

    const response = await apiClient.post<ApiResponse<Session>>(
      SESSIONS_ENDPOINTS.CREATE,
      data,
    );

    console.log("[SessionsAPI] Session created:", response.data.data.id);
    return response.data.data;
  } catch (error) {
    console.error("[SessionsAPI] Failed to create session:", error);
    throw error;
  }
}

/**
 * Accept a pending session request.
 */
export async function acceptSession(id: string): Promise<Session> {
  try {
    console.log("[SessionsAPI] Accepting session:", id);

    const response = await apiClient.post<ApiResponse<Session>>(
      SESSIONS_ENDPOINTS.ACCEPT(id),
    );

    console.log("[SessionsAPI] Session accepted:", id);
    return response.data.data;
  } catch (error) {
    console.error("[SessionsAPI] Failed to accept session:", error);
    throw error;
  }
}

/**
 * Decline a pending session request.
 */
export async function declineSession(
  id: string,
  reason?: string,
): Promise<Session> {
  try {
    console.log("[SessionsAPI] Declining session:", id);

    const response = await apiClient.post<ApiResponse<Session>>(
      SESSIONS_ENDPOINTS.DECLINE(id),
      reason ? { reason } : undefined,
    );

    console.log("[SessionsAPI] Session declined:", id);
    return response.data.data;
  } catch (error) {
    console.error("[SessionsAPI] Failed to decline session:", error);
    throw error;
  }
}

/**
 * Cancel an active session.
 */
export async function cancelSession(
  id: string,
  reason?: string,
): Promise<Session> {
  try {
    console.log("[SessionsAPI] Cancelling session:", id);

    const response = await apiClient.post<ApiResponse<Session>>(
      SESSIONS_ENDPOINTS.CANCEL(id),
      reason ? { reason } : undefined,
    );

    console.log("[SessionsAPI] Session cancelled:", id);
    return response.data.data;
  } catch (error) {
    console.error("[SessionsAPI] Failed to cancel session:", error);
    throw error;
  }
}

/**
 * Confirm sent or received for a session.
 */
export async function confirmSession(
  id: string,
  confirmationType: ConfirmationType,
): Promise<Session> {
  try {
    console.log(
      "[SessionsAPI] Confirming session:",
      id,
      "type:",
      confirmationType,
    );

    const response = await apiClient.post<ApiResponse<Session>>(
      SESSIONS_ENDPOINTS.CONFIRM(id),
      { type: confirmationType },
    );

    console.log("[SessionsAPI] Session confirmed:", id);
    return response.data.data;
  } catch (error) {
    console.error("[SessionsAPI] Failed to confirm session:", error);
    throw error;
  }
}
