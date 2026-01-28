/**
 * API Module
 *
 * Central export point for all API functionality.
 */

// Configuration
export {
  DATA_SOURCE,
  USE_API,
  API_BASE_URL,
  API_URLS,
  TOKEN_CONFIG,
} from "./config";
export type { DataSource } from "./config";

// Client
export {
  apiClient,
  ApiClientError,
  setBaseUrl,
  getCurrentBaseUrl,
} from "./client";

// Storage
export {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpiry,
  isTokenExpired,
  clearTokens,
  saveUserData,
  getUserData,
  clearUserData,
  clearAllAuthData,
} from "./storage";

// Endpoints
export {
  AUTH_ENDPOINTS,
  PROFILE_ENDPOINTS,
  OFFERS_ENDPOINTS,
  SESSIONS_ENDPOINTS,
  MESSAGES_ENDPOINTS,
  RATINGS_ENDPOINTS,
  NOTIFICATIONS_ENDPOINTS,
} from "./endpoints";

// Types
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  UserRole,
  UserProfile,
  UserTrust,
  AuthUser,
  AuthTokens,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  GuestRequest,
  GuestResponse,
  RefreshRequest,
  RefreshResponse,
  MeResponse,
  OfferType,
  OfferStatus,
  FxOfferData,
  ShippingOfferData,
  Offer,
  OfferListParams,
  CreateFxOfferRequest,
  CreateShippingOfferRequest,
  CreateOfferRequest,
  SessionStatus,
  ConfirmationType,
  Session,
  CreateSessionRequest,
  SessionListParams,
  Conversation,
  Message,
  SendMessageRequest,
  Rating,
  CreateRatingRequest,
  NotificationType,
  Notification,
} from "./types";

// Auth API
export {
  register,
  login,
  loginAsGuest,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "./auth.api";

// Offers API
export {
  listOffers,
  listFxOffers,
  listShippingOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  getMyOffers,
} from "./offers.api";

// Sessions API
export {
  listSessions,
  getSession,
  createSession,
  acceptSession,
  declineSession,
  cancelSession,
  confirmSession,
} from "./sessions.api";

// Messages API
export {
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
  markConversationRead,
} from "./messages.api";

// Ratings API
export { createRating, getUserRatings } from "./ratings.api";

// Profile API
export {
  getProfile,
  updateProfile,
  getProfileById,
  uploadAvatar,
} from "./profile.api";
export type {
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "./profile.api";

// Notifications API
export {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  registerDevice,
} from "./notifications.api";
