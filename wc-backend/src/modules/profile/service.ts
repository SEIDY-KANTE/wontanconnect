import { profileRepository, PublicProfileData } from './repository.js';
import { auditService } from '../audit/service.js';
import { AUDIT_ACTIONS } from '../../shared/constants.js';
import { Errors } from '../../shared/errors.js';
import type { UpdateProfileInput } from './schemas.js';
import { Profile } from '@prisma/client';

class ProfileService {
  async getOwnProfile(userId: string): Promise<Profile | null> {
    return profileRepository.findByUserId(userId);
  }

  async getPublicProfile(userId: string): Promise<PublicProfileData | null> {
    return profileRepository.findPublicProfile(userId);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Profile> {
    const existingProfile = await profileRepository.findByUserId(userId);
    if (!existingProfile) {
      throw Errors.notFound('Profile');
    }

    const updatedProfile = await profileRepository.update(userId, input);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.PROFILE_UPDATE,
      actorId: userId,
      entityType: 'profile',
      entityId: existingProfile.id,
      oldValues: existingProfile,
      newValues: updatedProfile,
      ipAddress,
      userAgent,
    });

    return updatedProfile;
  }

  async uploadAvatar(
    userId: string,
    avatarUrl: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Profile> {
    const existingProfile = await profileRepository.findByUserId(userId);
    if (!existingProfile) {
      throw Errors.notFound('Profile');
    }

    const updatedProfile = await profileRepository.updateAvatar(userId, avatarUrl);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.PROFILE_UPDATE,
      actorId: userId,
      entityType: 'profile',
      entityId: existingProfile.id,
      oldValues: { avatarUrl: existingProfile.avatarUrl },
      newValues: { avatarUrl },
      ipAddress,
      userAgent,
    });

    return updatedProfile;
  }
}

export const profileService = new ProfileService();
