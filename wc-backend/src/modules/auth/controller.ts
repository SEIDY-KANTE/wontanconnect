import { Request, Response, NextFunction } from 'express';
import { authService } from './service.js';
import { sendSuccess, sendError } from '../../shared/response.js';
import { getClientIp, getUserAgent } from '../../shared/utils.js';
import type { RegisterInput, LoginInput, GuestInput, RefreshInput } from './schemas.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.register(input, getClientIp(req), getUserAgent(req));
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await authService.login(input, getClientIp(req), getUserAgent(req));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async guest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as GuestInput;
      const result = await authService.guest(input, getClientIp(req), getUserAgent(req));
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshInput;
      const tokens = await authService.refresh(refreshToken);
      sendSuccess(res, { tokens });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.auth!.userId, getClientIp(req), getUserAgent(req));
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.auth!.userId);
      if (!user) {
        sendError(res, 'RESOURCE_NOT_FOUND', 'User not found', 404);
        return;
      }

      sendSuccess(res, {
        id: user.id,
        email: user.email,
        isGuest: user.isGuest,
        emailVerified: user.emailVerified,
        role: user.role,
        profile: user.profile
          ? {
              displayName: user.profile.displayName,
              avatarUrl: user.profile.avatarUrl,
              bio: user.profile.bio,
              preferredCurrency: user.profile.preferredCurrency,
              language: user.profile.language,
              locationCity: user.profile.locationCity,
              locationCountry: user.profile.locationCountry,
            }
          : null,
        trust: user.trustProfile
          ? {
              score: user.trustProfile.trustScore,
              level: user.trustProfile.level,
              totalExchanges: user.trustProfile.totalExchanges,
              averageRating: Number(user.trustProfile.averageRating),
            }
          : null,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
