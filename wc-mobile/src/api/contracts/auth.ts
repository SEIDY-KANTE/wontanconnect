/**
 * Auth Contracts
 *
 * Authentication types and adapters.
 * Auth is relatively well-aligned, but we define strict schemas for safety.
 */

import { z } from "zod";

// ============================================================================
// USER ROLE
// ============================================================================

export const UserRoleSchema = z.enum(["user", "admin", "moderator"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

// ============================================================================
// USER PROFILE
// ============================================================================

export const BackendUserProfileSchema = z.object({
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
  preferredCurrency: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  locationCity: z.string().nullable().optional(),
  locationCountry: z.string().nullable().optional(),
});

export type BackendUserProfile = z.infer<typeof BackendUserProfileSchema>;

// ============================================================================
// TRUST PROFILE
// ============================================================================

export const BackendTrustProfileSchema = z
  .object({
    score: z.number().optional().default(0),
    level: z.string().optional().default("new"),
    totalExchanges: z.number().optional().default(0),
    averageRating: z.number().optional().default(0),
  })
  .nullable();

export type BackendTrustProfile = z.infer<typeof BackendTrustProfileSchema>;

// ============================================================================
// AUTHENTICATED USER
// ============================================================================

export const BackendAuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  isGuest: z.boolean(),
  emailVerified: z.boolean(),
  role: UserRoleSchema,
  profile: BackendUserProfileSchema.nullable(),
  trust: BackendTrustProfileSchema.optional(),
  createdAt: z.string(),
});

export type BackendAuthUser = z.infer<typeof BackendAuthUserSchema>;

// ============================================================================
// AUTH TOKENS
// ============================================================================

export const BackendAuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type BackendAuthTokens = z.infer<typeof BackendAuthTokensSchema>;

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

// Register
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
  language: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  user: BackendAuthUserSchema,
  tokens: BackendAuthTokensSchema,
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// Login
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  user: BackendAuthUserSchema,
  tokens: BackendAuthTokensSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Guest
export const GuestRequestSchema = z.object({
  deviceId: z.string(),
});

export type GuestRequest = z.infer<typeof GuestRequestSchema>;

export const GuestResponseSchema = z.object({
  user: BackendAuthUserSchema,
  tokens: BackendAuthTokensSchema,
});

export type GuestResponse = z.infer<typeof GuestResponseSchema>;

// Refresh
export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const RefreshResponseSchema = z.object({
  tokens: BackendAuthTokensSchema,
});

export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// ============================================================================
// MOBILE AUTH USER
// ============================================================================

export interface MobileAuthUser {
  id: string;
  email: string | null;
  isGuest: boolean;
  emailVerified: boolean;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferredCurrency: string | null;
  language: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  trustScore: number;
  trustLevel: string;
  totalExchanges: number;
  averageRating: number;
  createdAt: Date;
}

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Adapts backend auth user to mobile-friendly format
 */
export function adaptAuthUser(user: BackendAuthUser): MobileAuthUser {
  return {
    id: user.id,
    email: user.email,
    isGuest: user.isGuest,
    emailVerified: user.emailVerified,
    role: user.role,
    displayName: user.profile?.displayName ?? null,
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: user.profile?.bio ?? null,
    preferredCurrency: user.profile?.preferredCurrency ?? null,
    language: user.profile?.language ?? null,
    locationCity: user.profile?.locationCity ?? null,
    locationCountry: user.profile?.locationCountry ?? null,
    trustScore: user.trust?.score ?? 0,
    trustLevel: user.trust?.level ?? "new",
    totalExchanges: user.trust?.totalExchanges ?? 0,
    averageRating: user.trust?.averageRating ?? 0,
    createdAt: new Date(user.createdAt),
  };
}

/**
 * Validates and adapts raw auth user response
 */
export function validateAndAdaptAuthUser(raw: unknown): MobileAuthUser {
  const validated = BackendAuthUserSchema.parse(raw);
  return adaptAuthUser(validated);
}
