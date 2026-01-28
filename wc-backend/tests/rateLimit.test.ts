import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import express from 'express';
import request from 'supertest';
import { MemoryStore } from 'express-rate-limit';
import { createRateLimiter, getRateLimitKey } from '../src/middleware/rateLimit.js';

describe('rateLimit key generation', () => {
  it('uses userId when available', () => {
    const req = {
      auth: { userId: 'user-123' },
      ip: '203.0.113.5',
    } as Request;

    expect(getRateLimitKey(req)).toBe('user:user-123');
  });

  it('falls back to ip when unauthenticated', () => {
    const req = {
      ip: '203.0.113.5',
    } as Request;

    expect(getRateLimitKey(req)).toBe('ip:203.0.113.5');
  });

  it('falls back to socket remoteAddress when ip is missing', () => {
    const req = {
      socket: { remoteAddress: '203.0.113.6' },
    } as Request;

    expect(getRateLimitKey(req)).toBe('ip:203.0.113.6');
  });
});

describe('rateLimit middleware', () => {
  it('returns 429 after threshold in memory mode', async () => {
    const app = express();
    const limiter = createRateLimiter({
      name: 'test',
      windowMs: 1000,
      max: 2,
      message: 'Too many requests',
      store: new MemoryStore(),
    });

    app.use(limiter);
    app.get('/', (_req, res) => res.json({ ok: true }));

    await request(app).get('/').expect(200);
    await request(app).get('/').expect(200);

    const res = await request(app).get('/');
    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    });
    expect(typeof res.body.retryAfterSeconds).toBe('number');
  });
});
