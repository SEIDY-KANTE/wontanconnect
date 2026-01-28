/**
 * Common Contracts
 *
 * Shared types and utilities used across all API contracts.
 */

import { z } from "zod";

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Backend API response meta (included in all responses)
 */
export const BackendMetaSchema = z.object({
  timestamp: z.string(),
  requestId: z.string(),
});

export type BackendMeta = z.infer<typeof BackendMetaSchema>;

/**
 * Backend API error structure
 */
export const BackendErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type BackendError = z.infer<typeof BackendErrorSchema>;

/**
 * Generic backend API success response
 */
export function createBackendResponseSchema<T extends z.ZodType>(
  dataSchema: T,
) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      })
      .optional(),
    meta: BackendMetaSchema,
  });
}

/**
 * Backend API error response
 */
export const BackendErrorResponseSchema = z.object({
  success: z.literal(false),
  error: BackendErrorSchema,
  meta: BackendMetaSchema,
});

export type BackendErrorResponse = z.infer<typeof BackendErrorResponseSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates and parses backend response with proper error handling.
 * Logs validation errors in development mode.
 *
 * @param schema - Zod schema to validate against
 * @param data - Raw data from backend
 * @param context - Context string for error logging
 * @returns Validated and typed data
 * @throws ZodError if validation fails
 */
export function validateBackendResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string,
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (__DEV__) {
      console.error(`[API Contract] Validation failed for ${context}:`, error);
      console.error(
        "[API Contract] Received data:",
        JSON.stringify(data, null, 2),
      );
    }
    throw error;
  }
}

/**
 * Safely validates data, returning null on failure instead of throwing.
 * Useful for optional or nullable fields.
 *
 * @param schema - Zod schema to validate against
 * @param data - Raw data from backend
 * @returns Validated data or null if validation fails
 */
export function safeValidate<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Schema for ISO date string that transforms to Date object
 */
export const DateStringSchema = z.string().transform((val) => new Date(val));

/**
 * Schema for optional ISO date string
 */
export const OptionalDateStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

// ============================================================================
// USER SCHEMAS (Shared across modules)
// ============================================================================

/**
 * Basic user info returned in lists and embedded objects
 */
export const BackendUserBriefSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  trustScore: z.number().default(0),
});

export type BackendUserBrief = z.infer<typeof BackendUserBriefSchema>;

/**
 * Mobile user model (UI-friendly)
 */
export interface MobileUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  trustScore: number;
}

/**
 * Adapt backend user brief to mobile model
 */
export function adaptUserBrief(user: BackendUserBrief): MobileUser {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    trustScore: user.trustScore,
  };
}

// ============================================================================
// LOCATION SCHEMAS
// ============================================================================

export const BackendLocationSchema = z.object({
  city: z.string().nullable(),
  country: z.string().nullable(),
});

export type BackendLocation = z.infer<typeof BackendLocationSchema>;

export interface MobileLocation {
  city: string | null;
  country: string | null;
}

export function adaptLocation(location: BackendLocation): MobileLocation {
  return {
    city: location.city,
    country: location.country,
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Application error codes
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // Auth errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_RESPONSE = "INVALID_RESPONSE",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // Server errors
  SERVER_ERROR = "SERVER_ERROR",

  // Generic
  UNKNOWN = "UNKNOWN",
}

/**
 * Application error class with structured information
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly details?: unknown;
  readonly isRetryable: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      status?: number;
      details?: unknown;
      isRetryable?: boolean;
    },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
    this.isRetryable = options?.isRetryable ?? this.determineRetryable(code);
  }

  private determineRetryable(code: ErrorCode): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT,
      ErrorCode.SERVER_ERROR,
    ].includes(code);
  }

  static fromBackendError(error: BackendError, status: number): AppError {
    const codeMap: Record<string, ErrorCode> = {
      RESOURCE_NOT_FOUND: ErrorCode.NOT_FOUND,
      VALIDATION_ERROR: ErrorCode.VALIDATION_ERROR,
      UNAUTHORIZED: ErrorCode.UNAUTHORIZED,
      FORBIDDEN: ErrorCode.FORBIDDEN,
      CONFLICT: ErrorCode.CONFLICT,
    };

    return new AppError(
      error.message,
      codeMap[error.code] ?? ErrorCode.UNKNOWN,
      { status, details: error.details },
    );
  }
}
