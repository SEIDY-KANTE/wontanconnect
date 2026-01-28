import { ratingRepository, trustProfileRepository, RatingWithDetails } from './repository.js';
import { sessionRepository } from '../sessions/repository.js';
import { auditService } from '../audit/service.js';
import { AUDIT_ACTIONS } from '../../shared/constants.js';
import { Errors } from '../../shared/errors.js';
import { calculatePagination, PaginationMeta } from '../../shared/pagination.js';
import type { CreateRatingInput, RatingFiltersInput } from './schemas.js';
import { Rating, TrustProfile, TrustLevel } from '@prisma/client';

class RatingService {
  async submitRating(
    userId: string,
    sessionId: string,
    input: CreateRatingInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Rating> {
    // Get session
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw Errors.notFound('Session');
    }

    // Verify user is participant
    if (session.initiatorId !== userId && session.responderId !== userId) {
      throw Errors.forbidden('You are not a participant in this session');
    }

    // Session must be completed
    if (session.status !== 'completed') {
      throw Errors.invalidSessionState('Can only rate completed sessions');
    }

    // Check if already rated
    const existingRating = await ratingRepository.findBySessionAndRater(sessionId, userId);
    if (existingRating) {
      throw Errors.alreadyExists('Rating');
    }

    // Determine ratee
    const rateeId = session.initiatorId === userId ? session.responderId : session.initiatorId;

    // Create rating
    const rating = await ratingRepository.create(
      sessionId,
      userId,
      rateeId,
      input.score,
      input.comment,
      input.tags
    );

    // Recalculate trust profile
    await this.recalculateTrustProfile(rateeId);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.RATING_SUBMIT,
      actorId: userId,
      entityType: 'rating',
      entityId: rating.id,
      newValues: { sessionId, rateeId, score: input.score },
      ipAddress,
      userAgent,
    });

    return rating;
  }

  async getUserRatings(
    userId: string,
    filters: RatingFiltersInput
  ): Promise<{ ratings: RatingWithDetails[]; pagination: PaginationMeta }> {
    const { ratings, total } = await ratingRepository.findByRateeId(userId, filters);
    const pagination = calculatePagination(filters.page, filters.limit, total);

    return { ratings, pagination };
  }

  async getTrustProfile(userId: string): Promise<TrustProfile> {
    return trustProfileRepository.findOrCreate(userId);
  }

  async recalculateTrustProfile(userId: string): Promise<TrustProfile> {
    // Ensure profile exists
    await trustProfileRepository.findOrCreate(userId);

    // Get stats
    const [averageScore, totalRatings] = await Promise.all([
      ratingRepository.getAverageScore(userId),
      ratingRepository.getTotalRatings(userId),
    ]);

    // Calculate trust score (0-100)
    // Formula: base + (average rating contribution) + (volume bonus)
    let trustScore = 0;

    if (totalRatings > 0 && averageScore !== null) {
      // Convert 1-5 star average to 0-60 points
      const ratingComponent = ((averageScore - 1) / 4) * 60;

      // Volume bonus: up to 30 points for transaction history
      const volumeBonus = Math.min(totalRatings * 2, 30);

      // Base points for having any rating
      const basePoints = 10;

      trustScore = Math.round(basePoints + ratingComponent + volumeBonus);
    }

    // Determine trust level based on score
    let level: TrustLevel = 'newcomer';
    if (trustScore >= 80) {
      level = 'verified';
    } else if (trustScore >= 60) {
      level = 'expert';
    } else if (trustScore >= 40) {
      level = 'trusted';
    } else {
      level = 'newcomer';
    }

    // Update profile
    return trustProfileRepository.update(userId, {
      trustScore,
      level,
      totalRatings,
      averageRating: averageScore || 0,
    });
  }

  async getUserStats(userId: string): Promise<{
    trustProfile: TrustProfile;
    scoreDistribution: Record<number, number>;
    totalRatings: number;
  }> {
    const [trustProfile, scoreDistribution, totalRatings] = await Promise.all([
      trustProfileRepository.findOrCreate(userId),
      ratingRepository.getScoreDistribution(userId),
      ratingRepository.getTotalRatings(userId),
    ]);

    return { trustProfile, scoreDistribution, totalRatings };
  }
}

export const ratingService = new RatingService();
