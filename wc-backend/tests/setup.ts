/**
 * Test Setup
 *
 * Global setup for integration tests.
 * Initializes database connection and cleanup.
 */

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '3001';
process.env.API_VERSION = process.env.API_VERSION ?? 'v1';
process.env.APP_VERSION = process.env.APP_VERSION ?? 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/wontanconnect_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-jwt-secret-please-change-this-in-real-env';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ?? '60000';
process.env.RATE_LIMIT_AUTH = process.env.RATE_LIMIT_AUTH ?? '1000';
process.env.RATE_LIMIT_API = process.env.RATE_LIMIT_API ?? '1000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'fatal';

import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

const isIntegration = process.env.INTEGRATION_TESTS === 'true';

export let testPrisma: PrismaClient | null = null;

if (isIntegration) {
  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/wontanconnect_test',
      },
    },
  });

  beforeAll(async () => {
    await testPrisma?.$connect();
    console.log('Test database connected');
  });

  afterAll(async () => {
    await testPrisma?.$disconnect();
    console.log('Test database disconnected');
  });
}

// Helper to clean all test data
export async function cleanDatabase() {
  if (!testPrisma) {
    throw new Error('cleanDatabase called without INTEGRATION_TESTS=true');
  }
  // Delete in correct order to respect foreign key constraints
  try {
    // Use deleteMany on all models
    // Note: Model names follow Prisma naming convention (camelCase from schema)
    await testPrisma.pushToken.deleteMany({});
    await testPrisma.notification.deleteMany({});
    await testPrisma.rating.deleteMany({});
    await testPrisma.message.deleteMany({});
    await testPrisma.conversation.deleteMany({});
    await testPrisma.exchangeConfirmation.deleteMany({});
    await testPrisma.exchangeSession.deleteMany({});
    await testPrisma.offer.deleteMany({});
    await testPrisma.trustProfile.deleteMany({});
    await testPrisma.profile.deleteMany({});
    await testPrisma.refreshToken.deleteMany({});
    await testPrisma.user.deleteMany({});
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}
