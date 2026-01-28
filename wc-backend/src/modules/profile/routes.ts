import { Router } from 'express';
import { profileController } from './controller.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { authMiddleware, requireUser } from '../../middleware/auth.js';
import { updateProfileSchema, uploadAvatarSchema, userIdParamSchema } from './schemas.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get own profile
router.get('/', profileController.getOwnProfile.bind(profileController));

// Update own profile (requires non-guest)
router.patch(
  '/',
  requireUser,
  validateBody(updateProfileSchema),
  profileController.updateProfile.bind(profileController)
);

// Upload avatar (requires non-guest)
router.post(
  '/avatar',
  requireUser,
  validateBody(uploadAvatarSchema),
  profileController.uploadAvatar.bind(profileController)
);

// Get public profile of another user
router.get(
  '/:userId',
  validateParams(userIdParamSchema),
  profileController.getPublicProfile.bind(profileController)
);

export { router as profileRoutes };
