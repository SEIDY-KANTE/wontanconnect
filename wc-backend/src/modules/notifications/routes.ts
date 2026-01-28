import { Router } from 'express';
import { notificationController } from './controller.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import {
  registerPushTokenSchema,
  notificationFiltersSchema,
  notificationIdParamSchema,
} from './schemas.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get notifications
router.get(
  '/',
  validateQuery(notificationFiltersSchema),
  notificationController.getNotifications.bind(notificationController)
);

// Get unread count
router.get('/unread', notificationController.getUnreadCount.bind(notificationController));

// Mark single notification as read
router.patch(
  '/:id/read',
  validateParams(notificationIdParamSchema),
  notificationController.markAsRead.bind(notificationController)
);

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

// Register push token
router.post(
  '/register-device',
  validateBody(registerPushTokenSchema),
  notificationController.registerPushToken.bind(notificationController)
);

// Unregister push token
router.post(
  '/unregister-device',
  validateBody(z.object({ token: z.string() })),
  notificationController.unregisterPushToken.bind(notificationController)
);

export { router as notificationRoutes };
