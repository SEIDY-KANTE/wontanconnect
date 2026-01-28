import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { Express } from 'express';
import { cleanDatabase } from '../setup.js';

describe('Session Flow', () => {
  let app: Express;
  let aliceToken: string;
  let bobToken: string;
  let offerId: string;
  let sessionId: string;

  beforeAll(async () => {
    app = createApp();
    await cleanDatabase();

    // Create Alice (offer owner)
    const aliceReg = await request(app).post('/api/v1/auth/register').send({
      email: 'alice-session@example.com',
      password: 'Test1234!',
      displayName: 'Alice Session',
    });
    // Response format: { user, tokens: { accessToken, refreshToken } }
    aliceToken = aliceReg.body.data.tokens.accessToken;

    // Create Bob (session initiator)
    const bobReg = await request(app).post('/api/v1/auth/register').send({
      email: 'bob-session@example.com',
      password: 'Test1234!',
      displayName: 'Bob Session',
    });
    bobToken = bobReg.body.data.tokens.accessToken;

    // Alice creates an offer
    const offerRes = await request(app)
      .post('/api/v1/offers')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        type: 'fx',
        title: 'Session Test Offer',
        locationCity: 'Paris',
        locationCountry: 'FR',
        sourceCurrency: 'EUR',
        targetCurrency: 'TRY',
        sourceAmount: 500,
        rate: 34.5,
        rateType: 'negotiable',
      });

    offerId = offerRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('Complete Session Lifecycle', () => {
    it('Bob should create a session on Alice offer', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          offerId,
          proposedAmount: 300,
          message: 'I want to exchange 300 EUR',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.initiator.id).toBeDefined();
      expect(res.body.data.responder.id).toBeDefined();

      sessionId = res.body.data.id;
    });

    it('Alice should not create session on own offer', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ offerId, proposedAmount: 100 });

      expect(res.status).toBe(403);
    });

    it('Bob should not create duplicate session', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ offerId, proposedAmount: 200 });

      expect(res.status).toBe(409);
    });

    it('Both parties should see the session', async () => {
      const aliceRes = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${aliceToken}`);

      const bobRes = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(aliceRes.body.data.some((s: any) => s.id === sessionId)).toBe(true);
      expect(bobRes.body.data.some((s: any) => s.id === sessionId)).toBe(true);
    });

    it('Alice should accept the session', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/accept`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ acceptedAmount: 300 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('accepted');
    });

    it('Bob should confirm funds ready', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ confirmationType: 'sent' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('Alice should confirm funds ready', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ confirmationType: 'sent' });

      expect(res.status).toBe(200);
    });

    it('Bob should confirm funds received', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ confirmationType: 'received' });

      expect(res.status).toBe(200);
    });

    it('Alice should confirm funds received and complete session', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ confirmationType: 'received' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
    });

    it('Bob should rate Alice after completion', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/rating`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          score: 5,
          comment: 'Great exchange!',
          tags: ['punctual', 'professional'],
        });

      expect(res.status).toBe(201);
    });

    it('Alice should rate Bob after completion', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/rating`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          score: 4,
          comment: 'Good experience',
        });

      expect(res.status).toBe(201);
    });

    it('Should not allow duplicate ratings', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${sessionId}/rating`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ score: 5 });

      expect(res.status).toBe(409);
    });
  });

  describe('Session Decline Flow', () => {
    let declineSessionId: string;

    it('Create another session to decline', async () => {
      // Create new offer
      const offerRes = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          type: 'fx',
          title: 'Decline Test Offer',
          locationCity: 'Paris',
          locationCountry: 'FR',
          sourceCurrency: 'EUR',
          targetCurrency: 'USD',
          sourceAmount: 200,
          rate: 1.08,
          rateType: 'fixed',
        });

      const sessionRes = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ offerId: offerRes.body.data.id });

      declineSessionId = sessionRes.body.data.id;
      expect(sessionRes.status).toBe(201);
    });

    it('Alice should decline the session', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${declineSessionId}/decline`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ reason: 'Not available at this time' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('declined');
    });
  });

  describe('Session Cancel Flow', () => {
    let cancelSessionId: string;

    it('Create session and accept it', async () => {
      const offerRes = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          type: 'fx',
          title: 'Cancel Test Offer',
          locationCity: 'Paris',
          locationCountry: 'FR',
          sourceCurrency: 'EUR',
          targetCurrency: 'GBP',
          sourceAmount: 100,
          rate: 0.86,
          rateType: 'fixed',
        });

      const sessionRes = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ offerId: offerRes.body.data.id });

      cancelSessionId = sessionRes.body.data.id;

      await request(app)
        .post(`/api/v1/sessions/${cancelSessionId}/accept`)
        .set('Authorization', `Bearer ${aliceToken}`);
    });

    it('Bob should be able to cancel accepted session', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${cancelSessionId}/cancel`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ reason: 'Changed my mind' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });
  });
});
