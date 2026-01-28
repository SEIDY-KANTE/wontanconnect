import { Request, Response, NextFunction } from 'express';
import { profileService } from './service.js';
import { sendSuccess, sendError } from '../../shared/response.js';
import { getClientIp, getUserAgent } from '../../shared/utils.js';
import type { UpdateProfileInput, UploadAvatarInput } from './schemas.js';

export class ProfileController {
  async getOwnProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await profileService.getOwnProfile(req.auth!.userId);
      if (!profile) {
        sendError(res, 'RESOURCE_NOT_FOUND', 'Profile not found', 404);
        return;
      }
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const profile = await profileService.getPublicProfile(userId!);
      if (!profile) {
        sendError(res, 'RESOURCE_NOT_FOUND', 'User not found', 404);
        return;
      }
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateProfileInput;
      const profile = await profileService.updateProfile(
        req.auth!.userId,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { avatarUrl } = req.body as UploadAvatarInput;
      const profile = await profileService.uploadAvatar(
        req.auth!.userId,
        avatarUrl,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, { avatarUrl: profile.avatarUrl });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
