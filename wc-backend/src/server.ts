import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeWebSocket, getConnectedUsersCount } from './modules/websocket/index.js';
import { initializeRateLimiter } from './middleware/rateLimit.js';

const app = createApp();

async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize rate limiter (Redis in production)
    await initializeRateLimiter();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
          version: env.APP_VERSION,
        },
        `🚀 WontanConnect API server running on port ${env.PORT}`
      );
    });

    // Initialize WebSocket server
    initializeWebSocket(server);
    logger.info('WebSocket server initialized');

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Received shutdown signal');

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during shutdown');
          process.exit(1);
        }
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled rejection');
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
