/**
 * Profile API
 *
 * API functions for user profile management.
 */

import { apiClient } from "./client";
import { PROFILE_ENDPOINTS } from "./endpoints";
import type { ApiResponse, UserProfile } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface UpdateProfileRequest {
  displayName?: string;
  phone?: string;
  preferredCurrency?: string;
  defaultLocation?: {
    country: string;
    city: string;
  };
}

export interface UpdateProfileResponse {
  user: UserProfile;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get current user's profile.
 * Returns the user profile data or null if not found.
 */
export async function getProfile(): Promise<UserProfile | null> {
  const response = await apiClient.get<ApiResponse<UserProfile>>(
    PROFILE_ENDPOINTS.GET,
  );
  // The backend sends the profile directly in data, not wrapped in { user: ... }
  return response.data.data || null;
}

/**
 * Update current user's profile.
 */
export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<UserProfile> {
  const response = await apiClient.patch<ApiResponse<UpdateProfileResponse>>(
    PROFILE_ENDPOINTS.UPDATE,
    data,
  );
  return response.data.data.user;
}

/**
 * Get another user's profile by ID.
 */
export async function getProfileById(userId: string): Promise<UserProfile> {
  const response = await apiClient.get<ApiResponse<{ user: UserProfile }>>(
    PROFILE_ENDPOINTS.GET_BY_ID(userId),
  );
  return response.data.data.user;
}

/**
 * Upload profile avatar.
 * @param imageUri - Local file URI or base64 image data
 */
export async function uploadAvatar(imageUri: string): Promise<string> {
  const formData = new FormData();

  // For React Native, we need to format the file correctly
  const filename = imageUri.split("/").pop() || "avatar.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  // React Native FormData expects this format for file uploads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (formData as any).append("avatar", {
    uri: imageUri,
    name: filename,
    type,
  });

  const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
    PROFILE_ENDPOINTS.UPLOAD_AVATAR,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data.avatarUrl;
}
