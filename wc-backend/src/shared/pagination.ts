import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from './constants.js';

// Pagination query schema
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_PAGE))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_LIMIT))
    .pipe(z.number().int().positive().max(MAX_LIMIT)),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function calculatePagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function getPaginationParams(query: PaginationQuery) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}
