// Error codes matching ARCHITECTURE.md
export const ERROR_CODES = {
  // Auth errors (401, 403)
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_GUEST_RESTRICTED: 'AUTH_GUEST_RESTRICTED',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource errors (404, 403)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_FORBIDDEN: 'RESOURCE_FORBIDDEN',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Business logic errors (400)
  SESSION_INVALID_STATE: 'SESSION_INVALID_STATE',
  OFFER_EXPIRED: 'OFFER_EXPIRED',
  RATING_NOT_ALLOWED: 'RATING_NOT_ALLOWED',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Server errors (500)
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(code: ErrorCode, message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Pre-configured error factories
export const Errors = {
  // Auth
  invalidCredentials: () =>
    new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid email or password', 401),

  tokenExpired: () => new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Access token has expired', 401),

  tokenInvalid: () =>
    new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, 'Invalid or malformed token', 401),

  unauthorized: (message = 'You are not authorized to perform this action') =>
    new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, message, 403),

  guestRestricted: () =>
    new AppError(
      ERROR_CODES.AUTH_GUEST_RESTRICTED,
      'This feature requires a registered account',
      403
    ),

  // Validation
  validation: (details: unknown) =>
    new AppError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 400, details),

  // Resources
  notFound: (resource: string) =>
    new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, `${resource} not found`, 404),

  forbidden: (message = 'Access denied') =>
    new AppError(ERROR_CODES.RESOURCE_FORBIDDEN, message, 403),

  // Rate limiting
  rateLimitExceeded: () =>
    new AppError(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Too many requests, please try again later', 429),

  // Business logic
  invalidSessionState: (message: string) =>
    new AppError(ERROR_CODES.SESSION_INVALID_STATE, message, 400),

  offerExpired: () => new AppError(ERROR_CODES.OFFER_EXPIRED, 'This offer has expired', 400),

  ratingNotAllowed: (message: string) => new AppError(ERROR_CODES.RATING_NOT_ALLOWED, message, 400),

  alreadyExists: (resource: string) =>
    new AppError(ERROR_CODES.ALREADY_EXISTS, `${resource} already exists`, 409),

  // Server
  internal: (message = 'An unexpected error occurred') =>
    new AppError(ERROR_CODES.SERVER_ERROR, message, 500),
};
