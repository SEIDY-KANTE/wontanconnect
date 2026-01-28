/**
 * API Endpoints
 *
 * Centralized endpoint paths for all API routes.
 * Keeps endpoint definitions in one place for easy maintenance.
 */

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  GUEST: "/auth/guest",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_EMAIL: "/auth/verify-email",
} as const;

// ============================================================================
// PROFILE ENDPOINTS
// ============================================================================

export const PROFILE_ENDPOINTS = {
  GET: "/profile",
  UPDATE: "/profile",
  GET_BY_ID: (userId: string) => `/profile/${userId}`,
  UPLOAD_AVATAR: "/profile/avatar",
} as const;

// ============================================================================
// OFFERS ENDPOINTS
// ============================================================================

export const OFFERS_ENDPOINTS = {
  LIST: "/offers",
  CREATE: "/offers",
  GET: (id: string) => `/offers/${id}`,
  UPDATE: (id: string) => `/offers/${id}`,
  DELETE: (id: string) => `/offers/${id}`,
  MY_OFFERS: "/offers/my",
} as const;

// ============================================================================
// SESSIONS ENDPOINTS
// ============================================================================

export const SESSIONS_ENDPOINTS = {
  LIST: "/sessions",
  CREATE: "/sessions",
  GET: (id: string) => `/sessions/${id}`,
  ACCEPT: (id: string) => `/sessions/${id}/accept`,
  DECLINE: (id: string) => `/sessions/${id}/decline`,
  CANCEL: (id: string) => `/sessions/${id}/cancel`,
  CONFIRM: (id: string) => `/sessions/${id}/confirm`,
} as const;

// ============================================================================
// MESSAGES ENDPOINTS
// ============================================================================

export const MESSAGES_ENDPOINTS = {
  CONVERSATIONS: "/conversations",
  CONVERSATION: (id: string) => `/conversations/${id}`,
  MESSAGES: (conversationId: string) =>
    `/conversations/${conversationId}/messages`,
  MARK_READ: (conversationId: string) =>
    `/conversations/${conversationId}/read`,
} as const;

// ============================================================================
// RATINGS ENDPOINTS
// ============================================================================

export const RATINGS_ENDPOINTS = {
  CREATE: (sessionId: string) => `/sessions/${sessionId}/rating`,
  GET_USER_RATINGS: (userId: string) => `/users/${userId}/ratings`,
} as const;

// ============================================================================
// NOTIFICATIONS ENDPOINTS
// ============================================================================

export const NOTIFICATIONS_ENDPOINTS = {
  LIST: "/notifications",
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: "/notifications/read-all",
  REGISTER_DEVICE: "/notifications/register-device",
} as const;
