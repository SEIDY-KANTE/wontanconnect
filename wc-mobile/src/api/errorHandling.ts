/**
 * API Error Handling Utilities
 *
 * Production-grade error handling that:
 * - NEVER falls back to mock data
 * - Provides structured error information
 * - Supports retry logic with exponential backoff
 * - Logs errors for monitoring
 */

import { config, errorLog, debugLog } from "@/config";
import { AppError, ErrorCode } from "./contracts/common";
import { RETRY } from "@/config";

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Network-related error
 */
export class NetworkError extends AppError {
  constructor(message: string = "Unable to connect to server") {
    super(message, ErrorCode.NETWORK_ERROR, { isRetryable: true });
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Session expired") {
    super(message, ErrorCode.SESSION_EXPIRED, { isRetryable: false });
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, ErrorCode.NOT_FOUND, { isRetryable: false });
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, { details, isRetryable: false });
  }
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

interface ErrorHandlerOptions {
  context: string;
  onAuthError?: () => void;
  onNetworkError?: () => void;
}

/**
 * Central error handler for API calls.
 *
 * CRITICAL: This function NEVER returns mock data.
 * It either throws a structured error or handles it appropriately.
 */
export function handleApiError(
  error: unknown,
  options: ErrorHandlerOptions,
): never {
  const { context, onAuthError, onNetworkError } = options;

  // Log for monitoring
  errorLog(context, error);

  // Already an AppError - just re-throw
  if (error instanceof AppError) {
    throw error;
  }

  // Handle axios errors
  if (error && typeof error === "object") {
    const axiosError = error as any;

    // No response - network error
    if (!axiosError.response) {
      onNetworkError?.();
      throw new NetworkError(
        "Network request failed. Please check your connection.",
      );
    }

    const { status, data } = axiosError.response;

    // Handle specific status codes
    switch (status) {
      case 401:
        onAuthError?.();
        throw new AuthenticationError(
          "Your session has expired. Please login again.",
        );

      case 403:
        throw new AppError(
          data?.error?.message ||
            "You do not have permission to perform this action",
          ErrorCode.FORBIDDEN,
          { status },
        );

      case 404:
        throw new NotFoundError(
          data?.error?.message || "The requested resource was not found",
        );

      case 409:
        throw new AppError(
          data?.error?.message || "A conflict occurred with the current state",
          ErrorCode.CONFLICT,
          { status },
        );

      case 422:
        throw new ValidationError(
          data?.error?.message || "The provided data is invalid",
          data?.error?.details,
        );

      case 500:
      case 502:
      case 503:
      case 504:
        throw new AppError(
          "Server error. Please try again later.",
          ErrorCode.SERVER_ERROR,
          { status, isRetryable: true },
        );

      default:
        throw new AppError(
          data?.error?.message || "An unexpected error occurred",
          ErrorCode.UNKNOWN,
          { status },
        );
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    throw new AppError(
      "Invalid data received from server",
      ErrorCode.INVALID_RESPONSE,
      { details: error },
    );
  }

  // Unknown error
  throw new AppError("An unexpected error occurred", ErrorCode.UNKNOWN);
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  multiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Executes a function with exponential backoff retry logic.
 *
 * Only retries on network errors and server errors (5xx).
 * Does NOT retry on auth errors (401), validation errors (400, 422), etc.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = RETRY.MAX_ATTEMPTS,
    baseDelay = RETRY.BASE_DELAY,
    maxDelay = RETRY.MAX_DELAY,
    multiplier = RETRY.MULTIPLIER,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt) || attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(multiplier, attempt - 1),
        maxDelay,
      );

      debugLog("Retry", `Attempt ${attempt} failed, retrying in ${delay}ms...`);

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Default retry condition - only retry on network and server errors
 */
function defaultShouldRetry(error: unknown, attempt: number): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }

  // Axios error without response = network error
  if (error && typeof error === "object") {
    const axiosError = error as any;
    if (!axiosError.response) return true;

    const status = axiosError.response?.status;
    return status >= 500 && status < 600;
  }

  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// EMPTY RESPONSES (for 404s and empty lists)
// ============================================================================

/**
 * Creates an empty list response for cases where no data exists.
 * This is NOT a mock - it's a legitimate empty state.
 */
export function emptyListResponse<T>(): {
  data: T[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  return {
    data: [],
    meta: {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    },
  };
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Converts an error to a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Gets an error title based on error code
 */
export function getErrorTitle(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        return "Connection Error";
      case ErrorCode.SESSION_EXPIRED:
      case ErrorCode.UNAUTHORIZED:
        return "Session Expired";
      case ErrorCode.FORBIDDEN:
        return "Access Denied";
      case ErrorCode.NOT_FOUND:
        return "Not Found";
      case ErrorCode.VALIDATION_ERROR:
        return "Invalid Data";
      case ErrorCode.SERVER_ERROR:
        return "Server Error";
      default:
        return "Error";
    }
  }

  return "Error";
}

/**
 * Checks if an error should show a retry button
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }
  return false;
}
