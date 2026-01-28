import rateLimit, {
  type AugmentedRequest,
  type RateLimitRequestHandler,
  type Store,
  type Options,
  MemoryStore,
} from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient, type RedisClientType } from 'redis';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

type LimiterConfig = {
  name: string;
  windowMs: number;
  max: number;
  message: string;
  store?: Store;
};

let redisClient: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;
let warnedNoRedis = false;
const limiterStores: SwitchableStore[] = [];

class SwitchableStore implements Store {
  private readonly prefix: string;
  private inner: Store;
  private lastOptions?: Options;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.inner = new MemoryStore();
  }

  init(options: Options): void {
    this.lastOptions = options;
    this.inner.init?.(options);
  }

  get(key: string) {
    return this.inner.get?.(key);
  }

  increment(key: string) {
    return this.inner.increment(key);
  }

  decrement(key: string) {
    return this.inner.decrement(key);
  }

  resetKey(key: string) {
    return this.inner.resetKey(key);
  }

  resetAll() {
    return this.inner.resetAll?.();
  }

  shutdown() {
    return this.inner.shutdown?.();
  }

  setStore(store: Store): void {
    this.inner = store;
    if (this.lastOptions) {
      this.inner.init?.(this.lastOptions);
    }
  }

  getPrefix(): string {
    return this.prefix;
  }
}

function createStore(prefix: string): SwitchableStore {
  const store = new SwitchableStore(prefix);
  limiterStores.push(store);
  return store;
}

async function ensureRedisClientReady(): Promise<RedisClientType | null> {
  if (!env.REDIS_URL) {
    if (env.NODE_ENV !== 'production' && !warnedNoRedis) {
      logger.warn(
        { environment: env.NODE_ENV },
        'Redis not configured for rate limiting; using in-memory store'
      );
      warnedNoRedis = true;
    }
    return null;
  }

  if (connectPromise) {
    return connectPromise;
  }

  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on('error', (error) => {
      logger.error({ error }, 'Redis rate limit client error');
    });
  }

  if (redisClient.isReady) {
    return redisClient;
  }

  connectPromise = redisClient
    .connect()
    .then(() => {
      logger.info('Redis rate limit client connected');
      return redisClient;
    })
    .catch((error) => {
      connectPromise = null;
      throw error;
    });

  return connectPromise;
}

export async function initializeRateLimiter(): Promise<void> {
  if (!env.REDIS_URL) {
    if (env.NODE_ENV === 'production') {
      throw new Error('REDIS_URL is required in production for distributed rate limiting');
    }
    return;
  }

  try {
    const client = await ensureRedisClientReady();
    if (!client) {
      return;
    }

    for (const store of limiterStores) {
      store.setStore(
        new RedisStore({
          sendCommand: (...args: string[]) => client.sendCommand(args),
          prefix: store.getPrefix(),
        })
      );
    }
  } catch (error) {
    if (env.NODE_ENV === 'production') {
      throw error;
    }
    logger.warn({ error }, 'Redis rate limit unavailable; using in-memory store');
  }
}

export function getRateLimitKey(req: Request): string {
  if (req.auth?.userId) {
    return `user:${req.auth.userId}`;
  }
  const ip =
    req.ip ||
    req.socket?.remoteAddress ||
    (req.connection && 'remoteAddress' in req.connection ? req.connection.remoteAddress : undefined);
  return `ip:${ip ?? '0.0.0.0'}`;
}

function getRetryAfterSeconds(req: Request, windowMs: number): number {
  const rateLimitInfo = (req as AugmentedRequest).rateLimit;
  if (rateLimitInfo?.resetTime instanceof Date) {
    const diffMs = rateLimitInfo.resetTime.getTime() - Date.now();
    return Math.max(1, Math.ceil(diffMs / 1000));
  }
  return Math.max(1, Math.ceil(windowMs / 1000));
}

function logRateLimitEvent(
  req: Request,
  res: Response,
  limiterName: string,
  retryAfterSeconds: number
): void {
  logger.warn(
    {
      limiter: limiterName,
      requestId: res.locals.requestId,
      userId: req.auth?.userId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      retryAfterSeconds,
    },
    'Rate limit exceeded'
  );
}

export function createRateLimiter(config: LimiterConfig): RateLimitRequestHandler {
  const store = config.store ?? createStore(`rl:${config.name}:`);

  return rateLimit({
    windowMs: config.windowMs,
    limit: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: getRateLimitKey,
    handler: (req, res) => {
      const retryAfterSeconds = getRetryAfterSeconds(req, config.windowMs);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      logRateLimitEvent(req, res, config.name, retryAfterSeconds);
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        retryAfterSeconds,
      });
    },
  });
}

export const apiLimiter = createRateLimiter({
  name: 'api',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_API,
  message: 'Too many requests, please try again later',
});

export const authLimiter = createRateLimiter({
  name: 'auth',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH,
  message: 'Too many authentication attempts, please try again later',
});

export const sensitiveWriteLimiter = createRateLimiter({
  name: 'sensitive-write',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many attempts, please try again in an hour',
});

// Backwards-compatible exports
export const apiRateLimiter = apiLimiter;
export const authRateLimiter = authLimiter;
export const sensitiveRateLimiter = sensitiveWriteLimiter;
