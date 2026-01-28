import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { Express } from 'express';
import { cleanDatabase } from '../setup.js';

describe('Offers Flow', () => {
  let app: Express;
  let accessToken: string;
  let createdOfferId: string;

  beforeAll(async () => {
    app = createApp();
    await cleanDatabase();

    // Register and login to get token
    const regRes = await request(app).post('/api/v1/auth/register').send({
      email: 'offers-test@example.com',
      password: 'Test1234!',
      displayName: 'Offers Tester',
    });

    // Response format: { user, tokens: { accessToken, refreshToken } }
    accessToken = regRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/offers', () => {
    it('should create an FX offer', async () => {
      const res = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'fx',
          title: 'EUR to USD Exchange',
          description: 'Great rates for EUR to USD',
          locationCity: 'New York',
          locationCountry: 'US',
          sourceCurrency: 'EUR',
          targetCurrency: 'USD',
          sourceAmount: 1000,
          rate: 1.08,
          minAmount: 100,
          maxAmount: 1000,
          rateType: 'negotiable',
          paymentMethods: ['cash', 'bank_transfer'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.type).toBe('fx');
      expect(res.body.data.title).toBe('EUR to USD Exchange');

      createdOfferId = res.body.data.id;
    });

    it('should create a shipping offer', async () => {
      const res = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'shipping',
          title: 'Paris to Istanbul Delivery',
          description: 'Traveling next week',
          locationCity: 'Paris',
          locationCountry: 'FR',
          originCity: 'Paris',
          originCountry: 'FR',
          destinationCity: 'Istanbul',
          destinationCountry: 'TR',
          departureDate: '2025-03-15',
          maxWeightKg: 5,
          pricePerKg: 20,
          acceptedItems: ['documents', 'electronics'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('shipping');
    });

    it('should reject offer without auth', async () => {
      const res = await request(app).post('/api/v1/offers').send({
        type: 'fx',
        title: 'Test Offer',
        locationCity: 'Test',
        locationCountry: 'US',
        sourceCurrency: 'EUR',
        targetCurrency: 'USD',
        sourceAmount: 100,
        rate: 1.0,
        rateType: 'fixed',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/offers', () => {
    it('should list all active offers', async () => {
      const res = await request(app)
        .get('/api/v1/offers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should filter offers by type', async () => {
      const res = await request(app)
        .get('/api/v1/offers?type=fx')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((o: any) => o.type === 'fx')).toBe(true);
    });

    it('should filter offers by currency', async () => {
      const res = await request(app)
        .get('/api/v1/offers?sourceCurrency=EUR')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      // All should have EUR as source
    });
  });

  describe('GET /api/v1/offers/:id', () => {
    it('should get offer details', async () => {
      const res = await request(app)
        .get(`/api/v1/offers/${createdOfferId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdOfferId);
      expect(res.body.data.fx).toBeDefined();
    });

    it('should return 404 for non-existent offer', async () => {
      const res = await request(app)
        .get('/api/v1/offers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/offers/:id', () => {
    it('should update own offer', async () => {
      const res = await request(app)
        .patch(`/api/v1/offers/${createdOfferId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated EUR to USD Exchange',
          rate: 1.09,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated EUR to USD Exchange');
    });
  });

  describe('GET /api/v1/offers/my', () => {
    it('should get my offers', async () => {
      const res = await request(app)
        .get('/api/v1/offers/my')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/v1/offers/:id', () => {
    it('should soft delete own offer', async () => {
      const res = await request(app)
        .delete(`/api/v1/offers/${createdOfferId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
