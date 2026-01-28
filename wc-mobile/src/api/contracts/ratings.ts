/**
 * Ratings Contracts
 *
 * Rating types and adapters.
 */

import { z } from "zod";
import { BackendPaginationSchema } from "./pagination";
import {
  BackendUserBriefSchema,
  adaptUserBrief,
  type MobileUser,
} from "./common";

// ============================================================================
// BACKEND SCHEMAS
// ============================================================================

/**
 * Backend rating format
 */
export const BackendRatingSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  rater: BackendUserBriefSchema.optional(), // May include rater details
  raterId: z.string().uuid(),
  ratedUserId: z.string().uuid(),
  score: z.number().min(1).max(5),
  comment: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type BackendRating = z.infer<typeof BackendRatingSchema>;

/**
 * Backend ratings list response
 */
export const BackendRatingsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(BackendRatingSchema),
  pagination: BackendPaginationSchema.optional(),
  // Backend may include averageScore and total in various places
  averageScore: z.number().optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    averageScore: z.number().optional(),
    totalRatings: z.number().optional(),
  }),
});

export type BackendRatingsListResponse = z.infer<
  typeof BackendRatingsListResponseSchema
>;

// ============================================================================
// MOBILE MODELS
// ============================================================================

/**
 * Mobile rating model
 */
export interface MobileRating {
  id: string;
  sessionId: string;
  rater: MobileUser | null;
  raterId: string;
  ratedUserId: string;
  score: number;
  comment: string | null;
  createdAt: Date;
}

/**
 * Rating statistics for a user
 */
export interface RatingStats {
  totalRatings: number;
  averageScore: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Adapts backend rating to mobile format
 */
export function adaptRating(rating: BackendRating): MobileRating {
  return {
    id: rating.id,
    sessionId: rating.sessionId,
    rater: rating.rater ? adaptUserBrief(rating.rater) : null,
    raterId: rating.raterId,
    ratedUserId: rating.ratedUserId,
    score: rating.score,
    comment: rating.comment ?? null,
    createdAt: new Date(rating.createdAt),
  };
}

/**
 * Validates and adapts raw rating response
 */
export function validateAndAdaptRating(raw: unknown): MobileRating {
  const validated = BackendRatingSchema.parse(raw);
  return adaptRating(validated);
}

/**
 * Validates and adapts raw ratings list response
 */
export function validateAndAdaptRatingsList(raw: unknown): {
  ratings: MobileRating[];
  pagination: z.infer<typeof BackendPaginationSchema> | undefined;
  averageScore: number;
  totalRatings: number;
} {
  const validated = BackendRatingsListResponseSchema.parse(raw);

  // Calculate average if not provided
  const ratings = validated.data.map(adaptRating);
  const totalRatings = validated.pagination?.total ?? ratings.length;
  const averageScore =
    validated.averageScore ??
    validated.meta?.averageScore ??
    (ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0);

  return {
    ratings,
    pagination: validated.pagination,
    averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
    totalRatings,
  };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Create rating request (matches backend)
 */
export interface CreateRatingRequest {
  score: number;
  comment?: string;
}

/**
 * Validates create rating request
 */
export function validateCreateRatingRequest(
  data: CreateRatingRequest,
): string[] {
  const errors: string[] = [];

  if (data.score < 1 || data.score > 5) {
    errors.push("Score must be between 1 and 5");
  }

  if (data.comment && data.comment.length > 500) {
    errors.push("Comment must be at most 500 characters");
  }

  return errors;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get star display for a score
 */
export function getStarDisplay(score: number): string {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    "★".repeat(fullStars) + (hasHalfStar ? "½" : "") + "☆".repeat(emptyStars)
  );
}

/**
 * Get rating label based on score
 */
export function getRatingLabel(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 4.0) return "Very Good";
  if (score >= 3.5) return "Good";
  if (score >= 3.0) return "Average";
  if (score >= 2.0) return "Below Average";
  return "Poor";
}

/**
 * Get rating color based on score
 */
export function getRatingColor(score: number): string {
  if (score >= 4.5) return "#4CAF50";
  if (score >= 4.0) return "#8BC34A";
  if (score >= 3.5) return "#FFC107";
  if (score >= 3.0) return "#FF9800";
  if (score >= 2.0) return "#FF5722";
  return "#F44336";
}
