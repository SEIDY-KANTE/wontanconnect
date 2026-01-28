/**
 * Profile Contracts
 *
 * CRITICAL FIX: Profile update has major contract mismatch:
 *
 * UPDATE PROFILE:
 * - Mobile sends: { defaultLocation: { city, country } }
 * - Backend expects: { locationCity, locationCountry }
 *
 * AVATAR UPLOAD:
 * - Mobile sends: multipart/form-data with file
 * - Backend expects: JSON with { avatarUrl } (pre-uploaded URL)
 */

import { z } from "zod";

// ============================================================================
// BACKEND SCHEMAS
// ============================================================================

/**
 * Backend profile response
 */
export const BackendProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
  preferredCurrency: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  locationCity: z.string().nullable().optional(),
  locationCountry: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BackendProfile = z.infer<typeof BackendProfileSchema>;

/**
 * Backend update profile request (what server expects)
 */
export const BackendUpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  preferredCurrency: z.string().length(3).optional(),
  language: z.string().max(5).optional(),
  timezone: z.string().optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().length(2).optional(),
});

export type BackendUpdateProfileRequest = z.infer<
  typeof BackendUpdateProfileSchema
>;

/**
 * Backend avatar upload request (what server expects)
 */
export const BackendUploadAvatarSchema = z.object({
  avatarUrl: z.string().url(),
});

export type BackendUploadAvatarRequest = z.infer<
  typeof BackendUploadAvatarSchema
>;

// ============================================================================
// MOBILE MODELS
// ============================================================================

/**
 * Mobile profile model
 */
export interface MobileProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferredCurrency: string | null;
  language: string | null;
  timezone: string | null;
  location: {
    city: string | null;
    country: string | null;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mobile update profile request (what UI sends)
 */
export interface MobileUpdateProfileRequest {
  displayName?: string;
  bio?: string;
  preferredCurrency?: string;
  language?: string;
  timezone?: string;
  defaultLocation?: {
    city: string;
    country: string;
  };
}

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Adapts backend profile to mobile format
 */
export function adaptProfile(profile: BackendProfile): MobileProfile {
  return {
    id: profile.id,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    preferredCurrency: profile.preferredCurrency ?? null,
    language: profile.language ?? null,
    timezone: profile.timezone ?? null,
    location: {
      city: profile.locationCity ?? null,
      country: profile.locationCountry ?? null,
    },
    createdAt: profile.createdAt ? new Date(profile.createdAt) : undefined,
    updatedAt: profile.updatedAt ? new Date(profile.updatedAt) : undefined,
  };
}

/**
 * Validates and adapts raw profile response
 */
export function validateAndAdaptProfile(raw: unknown): MobileProfile {
  const validated = BackendProfileSchema.parse(raw);
  return adaptProfile(validated);
}

/**
 * CRITICAL: Adapts mobile update request to backend format
 *
 * Transforms:
 * - defaultLocation.city → locationCity
 * - defaultLocation.country → locationCountry
 */
export function adaptUpdateProfileRequest(
  mobile: MobileUpdateProfileRequest,
): BackendUpdateProfileRequest {
  const backend: BackendUpdateProfileRequest = {};

  if (mobile.displayName !== undefined) {
    backend.displayName = mobile.displayName;
  }
  if (mobile.bio !== undefined) {
    backend.bio = mobile.bio;
  }
  if (mobile.preferredCurrency !== undefined) {
    backend.preferredCurrency = mobile.preferredCurrency;
  }
  if (mobile.language !== undefined) {
    backend.language = mobile.language;
  }
  if (mobile.timezone !== undefined) {
    backend.timezone = mobile.timezone;
  }
  if (mobile.defaultLocation) {
    backend.locationCity = mobile.defaultLocation.city;
    backend.locationCountry = mobile.defaultLocation.country;
  }

  return backend;
}

/**
 * CRITICAL: Mobile avatar upload needs to be handled differently
 *
 * The backend expects a pre-uploaded URL, not a file.
 * Mobile should:
 * 1. Upload file to a storage service (S3, Firebase, etc.)
 * 2. Get the URL
 * 3. Send URL to backend
 *
 * This adapter just wraps the URL in the expected format.
 */
export function adaptAvatarUploadRequest(
  avatarUrl: string,
): BackendUploadAvatarRequest {
  return { avatarUrl };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates mobile update profile request before sending
 */
export function validateMobileUpdateProfile(
  data: MobileUpdateProfileRequest,
): string[] {
  const errors: string[] = [];

  if (data.displayName !== undefined) {
    if (data.displayName.length < 2) {
      errors.push("Display name must be at least 2 characters");
    }
    if (data.displayName.length > 50) {
      errors.push("Display name must be at most 50 characters");
    }
  }

  if (data.bio !== undefined && data.bio.length > 500) {
    errors.push("Bio must be at most 500 characters");
  }

  if (
    data.preferredCurrency !== undefined &&
    data.preferredCurrency.length !== 3
  ) {
    errors.push("Currency code must be exactly 3 characters");
  }

  if (data.defaultLocation) {
    if (!data.defaultLocation.city) {
      errors.push("City is required when setting location");
    }
    if (
      !data.defaultLocation.country ||
      data.defaultLocation.country.length !== 2
    ) {
      errors.push("Country must be a 2-letter ISO code");
    }
  }

  return errors;
}
