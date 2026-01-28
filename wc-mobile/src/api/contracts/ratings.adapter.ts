/**
 * Ratings Module Adapters
 *
 * Bidirectional adapters for ratings between mobile and backend.
 *
 * BACKEND FORMAT (from controller.ts):
 * - Rating: { id, score, comment, tags, reviewer, session, createdAt }
 * - Trust Profile: { trustScore, trustLevel, completedExchanges, totalRatings, averageRating, lastUpdated }
 * - User Stats: { trust: { score, level, completedExchanges, averageRating }, ratings: { total, distribution } }
 *
 * MOBILE EXPECTED FORMAT:
 * - Rating with 'averageScore' instead of 'score'
 *
 * CRITICAL MISMATCH:
 * - Backend uses 'score', mobile expects 'averageScore' in some contexts
 * - Backend uses 'overallScore' for create, mobile sends 'averageScore'
 */

import { z } from "zod";

// ============================================================================
// BACKEND SCHEMAS (What the backend actually returns)
// ============================================================================

/**
 * Backend reviewer format
 */
export const BackendReviewerSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

/**
 * Backend session info in rating
 */
export const BackendRatingSessionSchema = z.object({
  id: z.string().uuid(),
  offer: z
    .object({
      id: z.string().uuid(),
      type: z.enum(["fx", "shipping"]).optional(),
      title: z.string().optional(),
    })
    .optional(),
});

/**
 * Backend rating format from controller.formatRating()
 */
export const BackendRatingSchema = z.object({
  id: z.string().uuid(),
  score: z.number().min(1).max(5), // Backend uses 'score'
  comment: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  reviewer: BackendReviewerSchema,
  session: BackendRatingSessionSchema,
  createdAt: z.string().datetime(),
});

export type BackendRating = z.infer<typeof BackendRatingSchema>;

/**
 * Backend trust profile format
 */
export const BackendTrustProfileSchema = z.object({
  trustScore: z.number(),
  trustLevel: z.enum(["new", "bronze", "silver", "gold", "platinum"]),
  completedExchanges: z.number(),
  totalRatings: z.number(),
  averageRating: z.number(),
  lastUpdated: z.string().datetime(),
});

export type BackendTrustProfile = z.infer<typeof BackendTrustProfileSchema>;

/**
 * Backend user stats format
 */
export const BackendUserStatsSchema = z.object({
  trust: z.object({
    score: z.number(),
    level: z.string(),
    completedExchanges: z.number(),
    averageRating: z.number(),
  }),
  ratings: z.object({
    total: z.number(),
    distribution: z.record(z.number()), // { "1": 0, "2": 0, "3": 1, "4": 5, "5": 10 }
  }),
});

export type BackendUserStats = z.infer<typeof BackendUserStatsSchema>;

/**
 * Backend create rating request
 */
export const BackendCreateRatingRequestSchema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// MOBILE TYPES (What the mobile app expects)
// ============================================================================

export interface MobileReviewer {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface MobileRatingSession {
  id: string;
  offerType?: "fx" | "shipping";
  offerTitle?: string;
}

export interface MobileRating {
  id: string;
  score: number; // Keeping as 'score' for display
  averageScore: number; // Alias for backward compatibility
  comment?: string;
  tags?: string[];
  reviewer: MobileReviewer;
  session: MobileRatingSession;
  createdAt: Date;
}

export interface MobileTrustProfile {
  trustScore: number;
  trustLevel: "new" | "bronze" | "silver" | "gold" | "platinum";
  completedExchanges: number;
  totalRatings: number;
  averageRating: number;
  lastUpdated: Date;
}

export interface MobileUserStats {
  trust: {
    score: number;
    level: string;
    completedExchanges: number;
    averageRating: number;
  };
  ratings: {
    total: number;
    distribution: Record<string, number>;
    breakdown: Array<{ stars: number; count: number; percentage: number }>;
  };
}

export interface MobileCreateRatingRequest {
  sessionId: string;
  score: number; // 1-5
  comment?: string;
  tags?: string[];
}

// ============================================================================
// ADAPTERS: Backend → Mobile
// ============================================================================

/**
 * Adapt backend rating to mobile format
 */
export function adaptBackendRating(raw: unknown): MobileRating {
  const validated = BackendRatingSchema.parse(raw);

  return {
    id: validated.id,
    score: validated.score,
    averageScore: validated.score, // Alias for backward compatibility
    comment: validated.comment ?? undefined,
    tags: validated.tags ?? undefined,
    reviewer: {
      id: validated.reviewer.id,
      name: validated.reviewer.displayName || "Anonymous",
      avatarUrl: validated.reviewer.avatarUrl ?? undefined,
    },
    session: {
      id: validated.session.id,
      offerType: validated.session.offer?.type,
      offerTitle: validated.session.offer?.title,
    },
    createdAt: new Date(validated.createdAt),
  };
}

/**
 * Adapt array of backend ratings
 */
export function adaptBackendRatings(raw: unknown[]): MobileRating[] {
  return raw.map(adaptBackendRating);
}

/**
 * Adapt backend trust profile to mobile format
 */
export function adaptBackendTrustProfile(raw: unknown): MobileTrustProfile {
  const validated = BackendTrustProfileSchema.parse(raw);

  return {
    trustScore: validated.trustScore,
    trustLevel: validated.trustLevel,
    completedExchanges: validated.completedExchanges,
    totalRatings: validated.totalRatings,
    averageRating: validated.averageRating,
    lastUpdated: new Date(validated.lastUpdated),
  };
}

/**
 * Adapt backend user stats to mobile format with computed breakdown
 */
export function adaptBackendUserStats(raw: unknown): MobileUserStats {
  const validated = BackendUserStatsSchema.parse(raw);

  // Compute breakdown with percentages
  const total = validated.ratings.total || 1; // Avoid division by zero
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = validated.ratings.distribution[String(stars)] || 0;
    return {
      stars,
      count,
      percentage: Math.round((count / total) * 100),
    };
  });

  return {
    trust: {
      score: validated.trust.score,
      level: validated.trust.level,
      completedExchanges: validated.trust.completedExchanges,
      averageRating: validated.trust.averageRating,
    },
    ratings: {
      total: validated.ratings.total,
      distribution: validated.ratings.distribution,
      breakdown,
    },
  };
}

// ============================================================================
// ADAPTERS: Mobile → Backend
// ============================================================================

/**
 * Adapt mobile create rating request to backend format
 */
export function adaptCreateRatingRequest(
  mobile: Omit<MobileCreateRatingRequest, "sessionId">,
): z.infer<typeof BackendCreateRatingRequestSchema> {
  return {
    score: mobile.score, // Backend expects 'score'
    comment: mobile.comment,
    tags: mobile.tags,
  };
}

// ============================================================================
// TRUST LEVEL UTILITIES
// ============================================================================

export const TRUST_LEVEL_THRESHOLDS = {
  new: { minScore: 0, minExchanges: 0 },
  bronze: { minScore: 50, minExchanges: 3 },
  silver: { minScore: 100, minExchanges: 10 },
  gold: { minScore: 200, minExchanges: 25 },
  platinum: { minScore: 500, minExchanges: 50 },
};

export const TRUST_LEVEL_COLORS: Record<string, string> = {
  new: "#9E9E9E",
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

export const TRUST_LEVEL_ICONS: Record<string, string> = {
  new: "account-outline",
  bronze: "shield-outline",
  silver: "shield-half-full",
  gold: "shield-check",
  platinum: "shield-star",
};

/**
 * Get display info for a trust level
 */
export function getTrustLevelDisplay(level: string): {
  color: string;
  icon: string;
  label: string;
  nextLevel?: string;
  progressToNext?: number;
} {
  const color = TRUST_LEVEL_COLORS[level] || TRUST_LEVEL_COLORS.new;
  const icon = TRUST_LEVEL_ICONS[level] || TRUST_LEVEL_ICONS.new;
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  const levels = ["new", "bronze", "silver", "gold", "platinum"];
  const currentIndex = levels.indexOf(level);
  const nextLevel =
    currentIndex < levels.length - 1 ? levels[currentIndex + 1] : undefined;

  return { color, icon, label, nextLevel };
}

/**
 * Format rating score for display (e.g., 4.5 → "4.5")
 */
export function formatRatingScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Get star fill states for a rating (for star display)
 */
export function getStarStates(score: number): Array<"full" | "half" | "empty"> {
  const stars: Array<"full" | "half" | "empty"> = [];

  for (let i = 1; i <= 5; i++) {
    if (score >= i) {
      stars.push("full");
    } else if (score >= i - 0.5) {
      stars.push("half");
    } else {
      stars.push("empty");
    }
  }

  return stars;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a rating response
 */
export function validateRating(data: unknown): BackendRating | null {
  try {
    return BackendRatingSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Validate score is in valid range
 */
export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}
