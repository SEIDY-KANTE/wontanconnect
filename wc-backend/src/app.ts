import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/requestId.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

// Import routes
import { authRoutes } from './modules/auth/index.js';
import { profileRoutes } from './modules/profile/index.js';
import { offerRoutes } from './modules/offers/index.js';
import { sessionRoutes } from './modules/sessions/index.js';
import { messageRoutes } from './modules/messages/index.js';
import { ratingRoutes } from './modules/ratings/index.js';
import { notificationRoutes } from './modules/notifications/index.js';

export function createApp(): Express {
  const app = express();

  // Trust proxy for correct client IPs behind load balancers
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ============ Security Middleware ============
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    })
  );

  // ============ Request Processing ============
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  // TODO: Increase limits on specific upload routes if/when multipart uploads are added.

  // Request ID tracking
  app.use(requestIdMiddleware);

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          requestId: req.requestId,
        },
        'HTTP Request'
      );
    });

    next();
  });

  // ============ Rate Limiting ============
  app.use('/api', apiRateLimiter);

  // ============ Health Check ============
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
    });
  });

  // ============ API Routes ============
  const apiRouter = express.Router();

  // Auth routes
  apiRouter.use('/auth', authRoutes);

  // Profile routes
  apiRouter.use('/profile', profileRoutes);

  // Offers routes
  apiRouter.use('/offers', offerRoutes);

  // Sessions routes
  apiRouter.use('/sessions', sessionRoutes);

  // Messages/Conversations routes
  apiRouter.use('/conversations', messageRoutes);

  // Ratings routes (mounted at root for /sessions/:id/rating and /users/:id/ratings)
  apiRouter.use('/', ratingRoutes);

  // Notifications routes
  apiRouter.use('/notifications', notificationRoutes);

  // Mount API router
  app.use('/api/v1', apiRouter);

  // ============ Error Handling ============
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
