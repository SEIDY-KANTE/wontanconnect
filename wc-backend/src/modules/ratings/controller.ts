import { Request, Response, NextFunction } from 'express';
import { ratingService } from './service.js';
import { sendSuccess, sendError } from '../../shared/response.js';
import { getClientIp, getUserAgent } from '../../shared/utils.js';
import type { CreateRatingInput, RatingFiltersInput } from './schemas.js';

function formatRating(rating: any) {
  return {
    id: rating.id,
    score: rating.score,
    comment: rating.comment,
    tags: rating.tags,
    reviewer: {
      id: rating.reviewer.id,
      displayName: rating.reviewer.profile?.displayName,
      avatarUrl: rating.reviewer.profile?.avatarUrl,
    },
    session: {
      id: rating.session.id,
      offer: rating.session.offer,
    },
    createdAt: rating.createdAt,
  };
}

export class RatingController {
  async submitRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const input = req.body as CreateRatingInput;
      const rating = await ratingService.submitRating(
        req.auth!.userId,
        sessionId!,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, rating, 201);
    } catch (error) {
      next(error);
    }
  }

  async getUserRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const filters = req.query as unknown as RatingFiltersInput;
      const { ratings, pagination } = await ratingService.getUserRatings(userId!, filters);
      sendSuccess(res, ratings.map(formatRating), 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getTrustProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const trustProfile = await ratingService.getTrustProfile(userId!);
      sendSuccess(res, {
        trustScore: trustProfile.trustScore,
        trustLevel: trustProfile.trustLevel,
        completedExchanges: trustProfile.completedExchanges,
        totalRatings: trustProfile.totalRatings,
        averageRating: Number(trustProfile.averageRating),
        lastUpdated: trustProfile.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const stats = await ratingService.getUserStats(userId!);
      sendSuccess(res, {
        trust: {
          score: stats.trustProfile.trustScore,
          level: stats.trustProfile.trustLevel,
          completedExchanges: stats.trustProfile.completedExchanges,
          averageRating: Number(stats.trustProfile.averageRating),
        },
        ratings: {
          total: stats.totalRatings,
          distribution: stats.scoreDistribution,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ratingController = new RatingController();
