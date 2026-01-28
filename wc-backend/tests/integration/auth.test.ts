import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { Express } from 'express';
import { cleanDatabase } from '../setup.js';

describe('Auth Flow', () => {
  let app: Express;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = createApp();
    // Clean database before tests
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Test1234!',
        displayName: 'Test User',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Response format: { user, tokens: { accessToken, refreshToken, expiresIn } }
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe('test@example.com');

      // Store tokens for later tests
      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Test1234!',
        displayName: 'Another User',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ALREADY_EXISTS');
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'weak@example.com',
        password: '123',
        displayName: 'Weak Password User',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'Test1234!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Response format: { user, tokens: { accessToken, refreshToken, expiresIn } }
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');

      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should reject missing token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Refresh endpoint returns { tokens: { accessToken, refreshToken } }
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/guest', () => {
    it('should create guest user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/guest')
        .send({ deviceId: 'test-device-123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.user.isGuest).toBe(true);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get fresh token
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'Test1234!',
      });

      const token = loginRes.body.data.tokens.accessToken;
      const refresh = loginRes.body.data.tokens.refreshToken;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken: refresh });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
