import { Router } from 'express';
import { ratingController } from './controller.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authMiddleware, requireUser, optionalAuthMiddleware } from '../../middleware/auth.js';
import {
  createRatingSchema,
  ratingFiltersSchema,
  sessionIdParamSchema,
  userIdParamSchema,
} from './schemas.js';

const router = Router();

// Submit rating for a session (requires auth)
router.post(
  '/sessions/:sessionId/rating',
  authMiddleware,
  requireUser,
  validateParams(sessionIdParamSchema),
  validateBody(createRatingSchema),
  ratingController.submitRating.bind(ratingController)
);

// Get user's received ratings (public with optional auth)
router.get(
  '/users/:userId/ratings',
  optionalAuthMiddleware,
  validateParams(userIdParamSchema),
  validateQuery(ratingFiltersSchema),
  ratingController.getUserRatings.bind(ratingController)
);

// Get user's trust profile (public)
router.get(
  '/users/:userId/trust',
  optionalAuthMiddleware,
  validateParams(userIdParamSchema),
  ratingController.getTrustProfile.bind(ratingController)
);

// Get user's full stats (public)
router.get(
  '/users/:userId/stats',
  optionalAuthMiddleware,
  validateParams(userIdParamSchema),
  ratingController.getUserStats.bind(ratingController)
);

export { router as ratingRoutes };
