/**
 * API Types
 *
 * TypeScript types for API requests and responses.
 * These types mirror the backend's Zod schemas for type safety.
 */

// ============================================================================
// COMMON API TYPES
// ============================================================================

/**
 * Standard API response wrapper from backend.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Standard API error response.
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Pagination parameters for list endpoints.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// AUTH TYPES
// ============================================================================

/**
 * User role from backend.
 */
export type UserRole = "user" | "admin" | "moderator";

/**
 * User profile from backend.
 */
export interface UserProfile {
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferredCurrency: string | null;
  language: string | null;
  locationCity: string | null;
  locationCountry: string | null;
}

/**
 * User trust profile from backend.
 */
export interface UserTrust {
  score: number;
  level: string;
  totalExchanges: number;
  averageRating: number;
}

/**
 * Authenticated user data from backend.
 */
export interface AuthUser {
  id: string;
  email: string | null;
  isGuest: boolean;
  emailVerified: boolean;
  role: UserRole;
  profile: UserProfile | null;
  trust: UserTrust | null;
  createdAt: string;
}

/**
 * Auth tokens from backend.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Register request body.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  language?: string;
}

/**
 * Register response.
 */
export interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/**
 * Login request body.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response.
 */
export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/**
 * Guest login request body.
 */
export interface GuestRequest {
  deviceId: string;
}

/**
 * Guest login response.
 */
export interface GuestResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/**
 * Refresh token request body.
 */
export interface RefreshRequest {
  refreshToken: string;
}

/**
 * Refresh token response.
 */
export interface RefreshResponse {
  tokens: AuthTokens;
}

/**
 * Get me response (same as AuthUser).
 */
export type MeResponse = AuthUser;

// ============================================================================
// OFFER TYPES
// ============================================================================

/**
 * Offer type from backend.
 */
export type OfferType = "fx" | "shipping";

/**
 * Offer status from backend.
 */
export type OfferStatus = "active" | "paused" | "completed" | "cancelled";

/**
 * FX Offer from backend.
 */
export interface FxOfferData {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  minAmount: number | null;
  maxAmount: number | null;
}

/**
 * Shipping Offer from backend.
 */
export interface ShippingOfferData {
  originCountry: string;
  originCity: string | null;
  destinationCountry: string;
  destinationCity: string | null;
  maxWeight: number | null;
  pricePerKg: number | null;
  availableFrom: string | null;
  availableTo: string | null;
}

/**
 * Offer from backend.
 */
export interface Offer {
  id: string;
  type: OfferType;
  status: OfferStatus;
  description: string | null;
  userId: string;
  user: {
    id: string;
    email: string | null;
    isGuest: boolean;
    profile: UserProfile | null;
    trustProfile: UserTrust | null;
  };
  fxOffer: FxOfferData | null;
  shippingOffer: ShippingOfferData | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Offer list query params.
 */
export interface OfferListParams extends PaginationParams {
  type?: OfferType;
  status?: OfferStatus;
  sourceCurrency?: string;
  targetCurrency?: string;
  originCountry?: string;
  destinationCountry?: string;
}

/**
 * Create FX Offer request.
 */
export interface CreateFxOfferRequest {
  type: "fx";
  title: string;
  description?: string;
  locationCity: string;
  locationCountry: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  rateType: "fixed" | "negotiable";
  paymentMethods?: string[];
  expiresAt?: string;
}

/**
 * Create Shipping Offer request.
 */
export interface CreateShippingOfferRequest {
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

/**
 * Create Offer request (union).
 */
export type CreateOfferRequest =
  | CreateFxOfferRequest
  | CreateShippingOfferRequest;

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Session status from backend.
 */
export type SessionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "in_progress"
  | "awaiting_confirmation"
  | "completed"
  | "cancelled"
  | "disputed";

/**
 * Session confirmation side.
 */
export type ConfirmationType = "sent" | "received";

/**
 * Exchange session from backend.
 */
export interface Session {
  id: string;
  offerId: string;
  initiatorId: string;
  responderId: string;
  status: SessionStatus;
  initiatorConfirmed: boolean;
  responderConfirmed: boolean;
  agreedAmount: number | null;
  agreedRate: number | null;
  notes: string | null;
  offer: Offer;
  initiator: AuthUser;
  responder: AuthUser;
  conversation?: { id: string } | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * Create session request.
 */
export interface CreateSessionRequest {
  offerId: string;
  agreedAmount?: number;
  agreedRate?: number;
  notes?: string;
}

/**
 * Session list params.
 */
export interface SessionListParams extends PaginationParams {
  status?: SessionStatus;
  type?: OfferType;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Conversation from backend.
 */
export interface Conversation {
  id: string;
  sessionId: string | null;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string | null;
  participant1: AuthUser;
  participant2: AuthUser;
  unreadCount: number;
  lastMessage: Message | null;
  createdAt: string;
}

/**
 * Message from backend.
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

/**
 * Send message request.
 */
export interface SendMessageRequest {
  content: string;
}

// ============================================================================
// RATING TYPES
// ============================================================================

/**
 * Rating from backend.
 */
export interface Rating {
  id: string;
  sessionId: string;
  raterId: string;
  ratedUserId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

/**
 * Create rating request.
 */
export interface CreateRatingRequest {
  score: number;
  comment?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification type from backend.
 */
export type NotificationType =
  | "session_request"
  | "session_accepted"
  | "session_declined"
  | "session_completed"
  | "message_received"
  | "rating_received";

/**
 * Notification from backend.
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
