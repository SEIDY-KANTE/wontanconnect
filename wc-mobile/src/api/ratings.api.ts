/**
 * Ratings API
 *
 * API endpoints for ratings and trust profiles.
 */

import { apiClient } from "./client";
import { RATINGS_ENDPOINTS } from "./endpoints";
import type {
  ApiResponse,
  Rating,
  CreateRatingRequest,
  PaginationParams,
} from "./types";

// ============================================================================
// RATINGS API FUNCTIONS
// ============================================================================

/**
 * Create a rating for a completed session.
 */
export async function createRating(
  sessionId: string,
  data: CreateRatingRequest,
): Promise<Rating> {
  try {
    console.log("[RatingsAPI] Creating rating for session:", sessionId);

    const response = await apiClient.post<ApiResponse<Rating>>(
      RATINGS_ENDPOINTS.CREATE(sessionId),
      data,
    );

    console.log("[RatingsAPI] Rating created:", response.data.data.id);
    return response.data.data;
  } catch (error) {
    console.error("[RatingsAPI] Failed to create rating:", error);
    throw error;
  }
}

/**
 * Get ratings for a specific user.
 */
export async function getUserRatings(
  userId: string,
  params?: PaginationParams,
): Promise<{ ratings: Rating[]; total: number; averageScore: number }> {
  try {
    console.log("[RatingsAPI] Fetching ratings for user:", userId);

    const response = await apiClient.get<
      ApiResponse<Rating[]> & { meta: { total: number; averageScore: number } }
    >(RATINGS_ENDPOINTS.GET_USER_RATINGS(userId), { params });

    const { data, meta } = response.data;

    console.log(
      "[RatingsAPI] Fetched",
      data.length,
      "ratings for user:",
      userId,
    );
    return {
      ratings: data,
      total: meta.total,
      averageScore: meta.averageScore || 0,
    };
  } catch (error) {
    console.error("[RatingsAPI] Failed to fetch user ratings:", error);
    throw error;
  }
}
