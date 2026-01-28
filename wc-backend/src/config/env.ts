import 'dotenv/config';
import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(1).max(65535),
  API_VERSION: z.string().default('v1'),
  APP_VERSION: z.string().default('0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8081'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_AUTH: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_API: z.coerce.number().int().positive().default(100),

  // WebSocket
  WS_V2_AUTH: booleanString,
  WS_TRUST_PROXY: booleanString,
  WS_AUTH_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  WS_MAX_CONNECTIONS_PER_USER: z.coerce.number().int().positive().default(5),
  WS_MAX_CONNECTIONS_PER_IP: z.coerce.number().int().positive().default(20),
  WS_MESSAGE_RATE_LIMIT: z.coerce.number().int().positive().default(60),
  WS_MESSAGE_RATE_WINDOW_MS: z.coerce.number().int().positive().default(60000),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Optional Redis
  REDIS_URL: z.string().url().optional(),

  // Optional monitoring
  SENTRY_DSN: z.string().url().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  if (parsed.data.NODE_ENV === 'production' && !parsed.data.REDIS_URL) {
    console.error('❌ REDIS_URL is required in production for distributed rate limiting');
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
