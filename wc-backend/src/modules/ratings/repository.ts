import { prisma } from '../../config/database.js';
import { Rating, TrustProfile, Prisma, TrustLevel } from '@prisma/client';
import { RatingFiltersInput } from './schemas.js';
import { getPaginationParams } from '../../shared/pagination.js';

export interface RatingWithDetails extends Rating {
  rater: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
  session: {
    id: string;
    offer: { id: string; title: string; type: string };
  };
}

export class RatingRepository {
  async create(
    sessionId: string,
    raterId: string,
    rateeId: string,
    score: number,
    comment?: string,
    tags?: string[]
  ): Promise<Rating> {
    return prisma.rating.create({
      data: {
        sessionId,
        raterId,
        rateeId,
        score,
        comment,
        tags: tags || [],
      },
    });
  }

  async findBySessionAndRater(sessionId: string, raterId: string): Promise<Rating | null> {
    return prisma.rating.findFirst({
      where: { sessionId, raterId },
    });
  }

  async findByRateeId(
    rateeId: string,
    filters: RatingFiltersInput
  ): Promise<{ ratings: RatingWithDetails[]; total: number }> {
    const { skip, take } = getPaginationParams(filters);

    const where: Prisma.RatingWhereInput = { rateeId };

    if (filters.minScore !== undefined) {
      where.score = { gte: filters.minScore };
    }

    if (filters.maxScore !== undefined) {
      where.score = { ...(where.score as object), lte: filters.maxScore };
    }

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          rater: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          session: {
            select: {
              id: true,
              offer: { select: { id: true, title: true, type: true } },
            },
          },
        },
      }),
      prisma.rating.count({ where }),
    ]);

    return { ratings, total };
  }

  async getAverageScore(userId: string): Promise<number | null> {
    const result = await prisma.rating.aggregate({
      where: { rateeId: userId },
      _avg: { score: true },
    });

    return result._avg.score;
  }

  async getTotalRatings(userId: string): Promise<number> {
    return prisma.rating.count({
      where: { rateeId: userId },
    });
  }

  async getScoreDistribution(userId: string): Promise<Record<number, number>> {
    const ratings = await prisma.rating.groupBy({
      by: ['score'],
      where: { rateeId: userId },
      _count: true,
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => {
      distribution[r.score] = r._count;
    });

    return distribution;
  }
}

export class TrustProfileRepository {
  async findOrCreate(userId: string): Promise<TrustProfile> {
    const existing = await prisma.trustProfile.findUnique({
      where: { userId },
    });

    if (existing) return existing;

    return prisma.trustProfile.create({
      data: { userId },
    });
  }

  async update(
    userId: string,
    data: {
      trustScore?: number;
      level?: TrustLevel;
      successfulExchanges?: number;
      totalRatings?: number;
      averageRating?: number;
    }
  ): Promise<TrustProfile> {
    return prisma.trustProfile.update({
      where: { userId },
      data,
    });
  }

  async incrementSuccessfulExchanges(userId: string): Promise<void> {
    await prisma.trustProfile.update({
      where: { userId },
      data: { successfulExchanges: { increment: 1 } },
    });
  }

  async findByUserId(userId: string): Promise<TrustProfile | null> {
    return prisma.trustProfile.findUnique({
      where: { userId },
    });
  }
}

export const ratingRepository = new RatingRepository();
export const trustProfileRepository = new TrustProfileRepository();
