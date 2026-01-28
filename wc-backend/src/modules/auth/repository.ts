import { prisma } from '../../config/database.js';
import { User, RefreshToken, Profile, TrustProfile, UserRole, Prisma } from '@prisma/client';
import { UserWithProfile } from '../../shared/types.js';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        trustProfile: true,
      },
    });
  }

  async createUser(data: {
    email?: string;
    passwordHash?: string;
    isGuest?: boolean;
    role?: UserRole;
    displayName: string;
    language?: string;
  }): Promise<UserWithProfile> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        isGuest: data.isGuest || false,
        role: data.role || 'user',
        profile: {
          create: {
            displayName: data.displayName,
            language: data.language || 'en',
          },
        },
        trustProfile: {
          create: {},
        },
      },
      include: {
        profile: true,
        trustProfile: true,
      },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  // Refresh token management
  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });
  }
}

export const authRepository = new AuthRepository();
