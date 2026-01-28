/**
 * Ratings API (Production-Ready)
 *
 * Complete ratings module with proper adapters, NO mock fallbacks.
 *
 * CRITICAL CHANGES:
 * - Uses adaptBackendRating for format alignment
 * - Proper error propagation (no silent failures)
 * - Trust profile and user stats support
 * - Rating submission with proper field mapping
 */

import { apiClient } from "./client";
import { handleApiError } from "./errorHandling";
import {
  adaptBackendPagination,
  type MobilePaginationMeta,
} from "./contracts/pagination";
import {
  adaptBackendRating,
  adaptBackendRatings,
  adaptBackendTrustProfile,
  adaptBackendUserStats,
  adaptCreateRatingRequest,
  type MobileRating,
  type MobileTrustProfile,
  type MobileUserStats,
  type MobileCreateRatingRequest,
} from "./contracts/ratings.adapter";
import { debugLog, errorLog } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

export interface RatingFilters {
  page?: number;
  limit?: number;
  minScore?: number;
  maxScore?: number;
}

export interface RatingsListResponse {
  ratings: MobileRating[];
  meta: MobilePaginationMeta;
}

// ============================================================================
// RATING ENDPOINTS
// ============================================================================

/**
 * Submit a rating for a completed session
 *
 * CRITICAL: Backend expects 'score', not 'averageScore'
 */
export async function submitRating(
  request: MobileCreateRatingRequest,
): Promise<MobileRating> {
  debugLog("RatingsAPI", "Submitting rating", {
    sessionId: request.sessionId,
    score: request.score,
  });

  try {
    const backendRequest = adaptCreateRatingRequest(request);

    const response = await apiClient.post(
      `/sessions/${request.sessionId}/ratings`,
      backendRequest,
    );

    const rating = adaptBackendRating(response.data.data);

    debugLog("RatingsAPI", "Rating submitted", rating.id);

    return rating;
  } catch (error) {
    errorLog("RatingsAPI", error, "submitRating");
    throw handleApiError(error);
  }
}

/**
 * Get ratings received by a user
 */
export async function getUserRatings(
  userId: string,
  filters?: RatingFilters,
): Promise<RatingsListResponse> {
  debugLog("RatingsAPI", "Getting user ratings", { userId, ...filters });

  try {
    const response = await apiClient.get(`/users/${userId}/ratings`, {
      params: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        minScore: filters?.minScore,
        maxScore: filters?.maxScore,
      },
    });

    const ratings = adaptBackendRatings(response.data.data);
    const meta = adaptBackendPagination(response.data.pagination);

    debugLog(
      "RatingsAPI",
      `Loaded ${ratings.length} ratings for user ${userId}`,
    );

    return { ratings, meta };
  } catch (error) {
    errorLog("RatingsAPI", error, `getUserRatings(${userId})`);
    throw handleApiError(error);
  }
}

/**
 * Get ratings for the current user
 */
export async function getMyRatings(
  filters?: RatingFilters,
): Promise<RatingsListResponse> {
  debugLog("RatingsAPI", "Getting my ratings", filters);

  try {
    const response = await apiClient.get("/me/ratings", {
      params: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        minScore: filters?.minScore,
        maxScore: filters?.maxScore,
      },
    });

    const ratings = adaptBackendRatings(response.data.data);
    const meta = adaptBackendPagination(response.data.pagination);

    debugLog("RatingsAPI", `Loaded ${ratings.length} of my ratings`);

    return { ratings, meta };
  } catch (error) {
    errorLog("RatingsAPI", error, "getMyRatings");
    throw handleApiError(error);
  }
}

// ============================================================================
// TRUST PROFILE ENDPOINTS
// ============================================================================

/**
 * Get trust profile for a user
 */
export async function getTrustProfile(
  userId: string,
): Promise<MobileTrustProfile> {
  debugLog("RatingsAPI", "Getting trust profile", userId);

  try {
    const response = await apiClient.get(`/users/${userId}/trust`);

    const profile = adaptBackendTrustProfile(response.data.data);

    debugLog("RatingsAPI", "Trust profile loaded", {
      level: profile.trustLevel,
      score: profile.trustScore,
    });

    return profile;
  } catch (error) {
    errorLog("RatingsAPI", error, `getTrustProfile(${userId})`);
    throw handleApiError(error);
  }
}

/**
 * Get full user stats (trust + ratings distribution)
 */
export async function getUserStats(userId: string): Promise<MobileUserStats> {
  debugLog("RatingsAPI", "Getting user stats", userId);

  try {
    const response = await apiClient.get(`/users/${userId}/stats`);

    const stats = adaptBackendUserStats(response.data.data);

    debugLog("RatingsAPI", "User stats loaded", {
      total: stats.ratings.total,
      level: stats.trust.level,
    });

    return stats;
  } catch (error) {
    errorLog("RatingsAPI", error, `getUserStats(${userId})`);
    throw handleApiError(error);
  }
}

/**
 * Get my trust profile (convenience wrapper)
 */
export async function getMyTrustProfile(): Promise<MobileTrustProfile> {
  debugLog("RatingsAPI", "Getting my trust profile");

  try {
    const response = await apiClient.get("/me/trust");

    return adaptBackendTrustProfile(response.data.data);
  } catch (error) {
    errorLog("RatingsAPI", error, "getMyTrustProfile");
    throw handleApiError(error);
  }
}

/**
 * Get my stats (convenience wrapper)
 */
export async function getMyStats(): Promise<MobileUserStats> {
  debugLog("RatingsAPI", "Getting my stats");

  try {
    const response = await apiClient.get("/me/stats");

    return adaptBackendUserStats(response.data.data);
  } catch (error) {
    errorLog("RatingsAPI", error, "getMyStats");
    throw handleApiError(error);
  }
}

// ============================================================================
// RATING TAGS
// ============================================================================

/**
 * Predefined rating tags for quick selection
 */
export const RATING_TAGS = {
  positive: [
    "Punctual",
    "Great communicator",
    "Fair rates",
    "Trustworthy",
    "Professional",
    "Friendly",
    "Quick response",
    "Flexible",
  ],
  negative: [
    "Late",
    "Poor communication",
    "Unfair rates",
    "Unprofessional",
    "Rude",
    "Slow response",
    "Inflexible",
    "No show",
  ],
};

/**
 * Get suggested tags based on score
 */
export function getSuggestedTags(score: number): string[] {
  if (score >= 4) {
    return RATING_TAGS.positive;
  } else if (score <= 2) {
    return RATING_TAGS.negative;
  }
  return [
    ...RATING_TAGS.positive.slice(0, 3),
    ...RATING_TAGS.negative.slice(0, 3),
  ];
}

// ============================================================================
// STORE HELPERS
// ============================================================================

/**
 * Prepend a new rating to a list
 */
export function prependRating(
  ratings: MobileRating[],
  newRating: MobileRating,
): MobileRating[] {
  // Check for duplicates
  if (ratings.some((r) => r.id === newRating.id)) {
    return ratings;
  }
  return [newRating, ...ratings];
}

/**
 * Calculate average score from ratings
 */
export function calculateAverageScore(ratings: MobileRating[]): number {
  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  MobileRating,
  MobileTrustProfile,
  MobileUserStats,
  MobileCreateRatingRequest,
  MobileReviewer,
} from "./contracts/ratings.adapter";

export {
  getTrustLevelDisplay,
  formatRatingScore,
  getStarStates,
  TRUST_LEVEL_COLORS,
  TRUST_LEVEL_ICONS,
  isValidScore,
} from "./contracts/ratings.adapter";
