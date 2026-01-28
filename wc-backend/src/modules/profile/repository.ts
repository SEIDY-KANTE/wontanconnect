import { prisma } from '../../config/database.js';
import { Profile, TrustProfile } from '@prisma/client';
import { UpdateProfileInput } from './schemas.js';

export interface PublicProfileData {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  memberSince: Date;
  trust: {
    score: number;
    level: string;
    totalExchanges: number;
    averageRating: number;
    badges: unknown[];
  };
}

export class ProfileRepository {
  async findByUserId(userId: string): Promise<Profile | null> {
    return prisma.profile.findUnique({
      where: { userId },
    });
  }

  async findPublicProfile(userId: string): Promise<PublicProfileData | null> {
    const result = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
            locationCity: true,
            locationCountry: true,
          },
        },
        trustProfile: {
          select: {
            trustScore: true,
            level: true,
            totalExchanges: true,
            averageRating: true,
            badges: true,
          },
        },
      },
    });

    if (!result || !result.profile) {
      return null;
    }

    return {
      id: result.id,
      displayName: result.profile.displayName,
      avatarUrl: result.profile.avatarUrl,
      bio: result.profile.bio,
      locationCity: result.profile.locationCity,
      locationCountry: result.profile.locationCountry,
      memberSince: result.createdAt,
      trust: result.trustProfile
        ? {
            score: result.trustProfile.trustScore,
            level: result.trustProfile.level,
            totalExchanges: result.trustProfile.totalExchanges,
            averageRating: Number(result.trustProfile.averageRating),
            badges: result.trustProfile.badges as unknown[],
          }
        : {
            score: 0,
            level: 'newcomer',
            totalExchanges: 0,
            averageRating: 0,
            badges: [],
          },
    };
  }

  async update(userId: string, data: UpdateProfileInput): Promise<Profile> {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<Profile> {
    return prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });
  }
}

export const profileRepository = new ProfileRepository();
