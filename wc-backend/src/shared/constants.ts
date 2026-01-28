// API Response constants
export const API_VERSION = 'v1';

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// JWT constants
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// Session status constants - matches Prisma enum
export const SESSION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  IN_PROGRESS: 'in_progress',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const;

// Valid session status transitions
export const SESSION_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'declined', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_confirmation', 'cancelled'],
  awaiting_confirmation: ['completed', 'cancelled', 'disputed'],
  completed: [],
  declined: [],
  cancelled: [],
  disputed: ['completed', 'cancelled'],
};

// Offer status constants
export const OFFER_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  COMPLETED: 'completed',
} as const;

// Offer types
export const OFFER_TYPE = {
  FX: 'fx',
  SHIPPING: 'shipping',
} as const;

// User roles
export const USER_ROLE = {
  GUEST: 'guest',
  USER: 'user',
  SUPPORT: 'support',
  ADMIN: 'admin',
} as const;

// Notification types
export const NOTIFICATION_TYPE = {
  SESSION_REQUEST: 'session_request',
  SESSION_ACCEPTED: 'session_accepted',
  SESSION_DECLINED: 'session_declined',
  SESSION_CANCELLED: 'session_cancelled',
  CONFIRMATION_RECEIVED: 'confirmation_received',
  SESSION_COMPLETED: 'session_completed',
  NEW_MESSAGE: 'new_message',
  RATING_RECEIVED: 'rating_received',
  OFFER_EXPIRED: 'offer_expired',
} as const;

// Audit action types
export const AUDIT_ACTIONS = {
  // Auth
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_CHANGE: 'user.password_change',

  // Profile
  PROFILE_UPDATE: 'profile.update',

  // Offers
  OFFER_CREATE: 'offer.create',
  OFFER_UPDATE: 'offer.update',
  OFFER_DELETE: 'offer.delete',
  OFFER_EXPIRE: 'offer.expire',

  // Sessions
  SESSION_CREATE: 'session.create',
  SESSION_ACCEPT: 'session.accept',
  SESSION_DECLINE: 'session.decline',
  SESSION_CANCEL: 'session.cancel',
  SESSION_CONFIRM: 'session.confirm',
  SESSION_COMPLETE: 'session.complete',
  SESSION_DISPUTE: 'session.dispute',

  // Messages
  MESSAGE_SEND: 'message.send',

  // Ratings
  RATING_SUBMIT: 'rating.submit',

  // Notifications
  NOTIFICATION_READ: 'notification.read',
} as const;

// Message types
export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  SYSTEM: 'system',
} as const;

// Trust levels
export const TRUST_LEVEL = {
  NEWCOMER: 'newcomer',
  TRUSTED: 'trusted',
  VERIFIED: 'verified',
  EXPERT: 'expert',
} as const;

// Trust score thresholds
export const TRUST_THRESHOLDS = {
  TRUSTED: 30,
  VERIFIED: 60,
  EXPERT: 85,
} as const;
