import { Router } from 'express';
import { authController } from './controller.js';
import { validateBody } from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema, guestSchema, refreshSchema } from './schemas.js';

const router = Router();

// Public routes with auth rate limiting
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

router.post(
  '/guest',
  authRateLimiter,
  validateBody(guestSchema),
  authController.guest.bind(authController)
);

router.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshSchema),
  authController.refresh.bind(authController)
);

// Protected routes
router.post('/logout', authMiddleware, authController.logout.bind(authController));

router.get('/me', authMiddleware, authController.me.bind(authController));

export { router as authRoutes };
