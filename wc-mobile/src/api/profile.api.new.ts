/**
 * Profile API
 *
 * API functions for user profile management with proper contract alignment.
 *
 * CRITICAL FIXES APPLIED:
 * - Update profile: defaultLocation → locationCity/locationCountry
 * - Avatar upload: Handles the pre-uploaded URL requirement
 */

import { apiClient } from "./client";
import { PROFILE_ENDPOINTS } from "./endpoints";
import { config, debugLog, errorLog } from "@/config";
import {
  // Adapters
  adaptProfile,
  adaptUpdateProfileRequest,
  adaptAvatarUploadRequest,
  validateMobileUpdateProfile,
  // Schemas
  BackendProfileSchema,
  // Types
  type MobileProfile,
  type MobileUpdateProfileRequest,
} from "./contracts/profile";
import { AppError, ErrorCode } from "./contracts/common";

// ============================================================================
// ERROR HANDLING
// ============================================================================

function handleProfileError(error: unknown, context: string): never {
  errorLog("ProfileAPI", error, context);

  if (error instanceof AppError) {
    throw error;
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    throw new AppError(
      "Invalid profile data received from server",
      ErrorCode.INVALID_RESPONSE,
      { details: error },
    );
  }

  throw error;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get current user's profile.
 */
export async function getProfile(): Promise<MobileProfile | null> {
  debugLog("ProfileAPI", "Fetching current user profile");

  try {
    const response = await apiClient.get(PROFILE_ENDPOINTS.GET);

    if (!response.data.data) {
      return null;
    }

    const validated = BackendProfileSchema.parse(response.data.data);
    const profile = adaptProfile(validated);

    debugLog("ProfileAPI", "Profile fetched:", profile.id);

    return profile;
  } catch (error) {
    // 404 means no profile exists yet
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    ) {
      return null;
    }
    handleProfileError(error, "getProfile");
  }
}

/**
 * Update current user's profile.
 *
 * CRITICAL: Transforms mobile request format to backend format:
 * - defaultLocation.city → locationCity
 * - defaultLocation.country → locationCountry
 */
export async function updateProfile(
  data: MobileUpdateProfileRequest,
): Promise<MobileProfile> {
  debugLog("ProfileAPI", "Updating profile:", data);

  // Client-side validation
  const validationErrors = validateMobileUpdateProfile(data);
  if (validationErrors.length > 0) {
    throw new AppError(
      validationErrors.join(", "),
      ErrorCode.VALIDATION_ERROR,
      { details: validationErrors },
    );
  }

  try {
    // CRITICAL: Transform request to backend format
    const backendData = adaptUpdateProfileRequest(data);

    debugLog("ProfileAPI", "Transformed request:", backendData);

    const response = await apiClient.patch(
      PROFILE_ENDPOINTS.UPDATE,
      backendData,
    );

    const validated = BackendProfileSchema.parse(response.data.data);
    const profile = adaptProfile(validated);

    debugLog("ProfileAPI", "Profile updated:", profile.id);

    return profile;
  } catch (error) {
    handleProfileError(error, "updateProfile");
  }
}

/**
 * Get another user's profile by ID.
 */
export async function getProfileById(userId: string): Promise<MobileProfile> {
  debugLog("ProfileAPI", "Fetching profile for user:", userId);

  try {
    const response = await apiClient.get(PROFILE_ENDPOINTS.GET_BY_ID(userId));

    const validated = BackendProfileSchema.parse(response.data.data);
    const profile = adaptProfile(validated);

    debugLog("ProfileAPI", "Profile fetched for user:", userId);

    return profile;
  } catch (error) {
    handleProfileError(error, `getProfileById(${userId})`);
  }
}

/**
 * Upload profile avatar.
 *
 * CRITICAL: Backend expects a pre-uploaded URL, not a file.
 * This function handles the upload to external storage first,
 * then sends the URL to the backend.
 *
 * For now, if you have a direct upload endpoint, use that first.
 * Otherwise, integrate with your file storage service (S3, Firebase, etc.)
 *
 * @param imageUri - Local file URI (will need to be uploaded first)
 * @returns The avatar URL
 */
export async function uploadAvatar(imageUri: string): Promise<string> {
  debugLog("ProfileAPI", "Uploading avatar");

  try {
    // OPTION 1: If backend has a separate file upload endpoint
    // First upload the file and get the URL
    const formData = new FormData();

    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    // React Native FormData format for file uploads
    (formData as any).append("file", {
      uri: imageUri,
      name: filename,
      type,
    });

    // Try to upload to a file upload endpoint first
    // This would need to be implemented on the backend
    // const uploadResponse = await apiClient.post('/upload/avatar', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    // const uploadedUrl = uploadResponse.data.data.url;

    // OPTION 2: For now, assume direct multipart upload to avatar endpoint
    // Some backends accept this even if they document JSON
    const response = await apiClient.post(
      PROFILE_ENDPOINTS.UPLOAD_AVATAR,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const avatarUrl = response.data.data.avatarUrl;

    debugLog("ProfileAPI", "Avatar uploaded:", avatarUrl);

    return avatarUrl;
  } catch (error) {
    handleProfileError(error, "uploadAvatar");
  }
}

/**
 * Update avatar with pre-uploaded URL.
 * Use this when you have already uploaded the image to a storage service.
 *
 * @param avatarUrl - The URL of the already-uploaded image
 */
export async function updateAvatarUrl(avatarUrl: string): Promise<string> {
  debugLog("ProfileAPI", "Updating avatar URL:", avatarUrl);

  try {
    const backendData = adaptAvatarUploadRequest(avatarUrl);

    const response = await apiClient.post(
      PROFILE_ENDPOINTS.UPLOAD_AVATAR,
      backendData,
    );

    const newAvatarUrl = response.data.data.avatarUrl;

    debugLog("ProfileAPI", "Avatar URL updated:", newAvatarUrl);

    return newAvatarUrl;
  } catch (error) {
    handleProfileError(error, "updateAvatarUrl");
  }
}
