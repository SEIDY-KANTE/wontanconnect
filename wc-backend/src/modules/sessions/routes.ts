import { Router } from 'express';
import { sessionController } from './controller.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authMiddleware, requireUser } from '../../middleware/auth.js';
import {
  createSessionSchema,
  acceptSessionSchema,
  declineSessionSchema,
  cancelSessionSchema,
  confirmSessionSchema,
  sessionFiltersSchema,
  sessionIdParamSchema,
} from './schemas.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List sessions
router.get(
  '/',
  validateQuery(sessionFiltersSchema),
  sessionController.listSessions.bind(sessionController)
);

// Create session (requires non-guest)
router.post(
  '/',
  requireUser,
  validateBody(createSessionSchema),
  sessionController.createSession.bind(sessionController)
);

// Get session details
router.get(
  '/:id',
  validateParams(sessionIdParamSchema),
  sessionController.getSession.bind(sessionController)
);

// Accept session (offer owner only)
router.post(
  '/:id/accept',
  requireUser,
  validateParams(sessionIdParamSchema),
  validateBody(acceptSessionSchema.optional()),
  sessionController.acceptSession.bind(sessionController)
);

// Decline session (offer owner only)
router.post(
  '/:id/decline',
  requireUser,
  validateParams(sessionIdParamSchema),
  validateBody(declineSessionSchema.optional()),
  sessionController.declineSession.bind(sessionController)
);

// Cancel session (either party)
router.post(
  '/:id/cancel',
  requireUser,
  validateParams(sessionIdParamSchema),
  validateBody(cancelSessionSchema.optional()),
  sessionController.cancelSession.bind(sessionController)
);

// Confirm session step
router.post(
  '/:id/confirm',
  requireUser,
  validateParams(sessionIdParamSchema),
  validateBody(confirmSessionSchema),
  sessionController.confirmSession.bind(sessionController)
);

export { router as sessionRoutes };
