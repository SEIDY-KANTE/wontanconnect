import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  preferredCurrency: z.string().length(3).optional(),
  language: z.string().max(5).optional(),
  timezone: z.string().optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().length(2).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const uploadAvatarSchema = z.object({
  avatarUrl: z.string().url('Invalid URL format'),
});

export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});
