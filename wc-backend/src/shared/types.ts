import { User, Profile, TrustProfile, UserRole, UserStatus } from '@prisma/client';

// Extended user type with relations
export interface UserWithProfile extends User {
  profile: Profile | null;
  trustProfile: TrustProfile | null;
}

// JWT payload types
export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  isGuest: boolean;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  jti: string; // token id for rotation
  iat: number;
  exp: number;
}

// Auth context (attached to request)
export interface AuthContext {
  userId: string;
  role: UserRole;
  isGuest: boolean;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
    interface Locals {
      requestId: string;
    }
  }
}

// Public user info (safe to expose)
export interface PublicUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  trustScore: number;
  level: string;
  memberSince: Date;
}

// Offer filter types
export interface OfferFilters {
  type?: 'fx' | 'shipping';
  status?: string;
  sourceCurrency?: string;
  targetCurrency?: string;
  originCountry?: string;
  destinationCountry?: string;
  locationCountry?: string;
  locationCity?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Session filter types
export interface SessionFilters {
  status?: string;
  type?: 'fx' | 'shipping';
  role?: 'initiator' | 'responder' | 'any';
}
