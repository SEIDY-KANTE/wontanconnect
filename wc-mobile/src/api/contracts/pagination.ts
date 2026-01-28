/**
 * Pagination Contracts
 *
 * Handles the critical mismatch between:
 * - Backend: Returns `pagination` object with `page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`
 * - Mobile: Expects `meta` object with `total`, `page`, `totalPages`, `limit`
 *
 * This adapter provides seamless conversion between the two formats.
 */

import { z } from "zod";

// ============================================================================
// BACKEND PAGINATION SCHEMA
// ============================================================================

/**
 * Backend pagination format (as returned by the server)
 * Located in response.pagination field
 */
export const BackendPaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type BackendPagination = z.infer<typeof BackendPaginationSchema>;

// ============================================================================
// MOBILE PAGINATION FORMAT
// ============================================================================

/**
 * Mobile pagination format (used throughout the app)
 */
export interface MobilePaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// PAGINATION PARAMS
// ============================================================================

/**
 * Pagination request parameters (sent to backend)
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  limit: 20,
};

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Adapts backend pagination response to mobile format.
 *
 * @example
 * // Backend returns:
 * {
 *   success: true,
 *   data: [...],
 *   pagination: { page: 1, limit: 20, total: 100, totalPages: 5, hasNext: true, hasPrev: false }
 * }
 *
 * // After adaptation, mobile can use:
 * { data: [...], meta: { page: 1, limit: 20, total: 100, totalPages: 5, hasNext: true, hasPrev: false } }
 */
export function adaptBackendPagination(
  pagination: BackendPagination | undefined | null,
): MobilePaginationMeta {
  if (!pagination) {
    return {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: DEFAULT_PAGINATION.limit,
      hasNext: false,
      hasPrev: false,
    };
  }

  return {
    total: pagination.total,
    page: pagination.page,
    totalPages: pagination.totalPages,
    limit: pagination.limit,
    hasNext: pagination.hasNext,
    hasPrev: pagination.hasPrev,
  };
}

/**
 * Creates mobile pagination from raw values (when backend doesn't return pagination object)
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): MobilePaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    totalPages,
    limit,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ============================================================================
// PAGINATED RESPONSE
// ============================================================================

/**
 * Generic paginated response format for mobile
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: MobilePaginationMeta;
}

/**
 * Creates a paginated response from backend data
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: BackendPagination | undefined,
): PaginatedResponse<T> {
  return {
    data,
    meta: adaptBackendPagination(pagination),
  };
}

/**
 * Empty paginated response (for error states or empty lists)
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    data: [],
    meta: {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: DEFAULT_PAGINATION.limit,
      hasNext: false,
      hasPrev: false,
    },
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates and adapts backend pagination from raw API response
 */
export function validateAndAdaptPagination(raw: unknown): MobilePaginationMeta {
  const result = BackendPaginationSchema.safeParse(raw);

  if (!result.success) {
    if (__DEV__) {
      console.warn("[Pagination] Invalid pagination format received:", raw);
    }
    return adaptBackendPagination(null);
  }

  return adaptBackendPagination(result.data);
}
