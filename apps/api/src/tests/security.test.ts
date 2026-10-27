import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Phase 10: Security Hardening, HTTP Headers & Rate Limiting', () => {
  it('enforces Helmet security headers on responses', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    // Helmet headers
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('handles CORS preflight and headers properly', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:3005')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('returns structured 404 error envelope for undefined endpoints', async () => {
    const res = await request(app).get('/api/v1/non-existent-security-check');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Requested endpoint does not exist');
  });

  it('rejects malformed JSON payloads gracefully with error middleware', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"invalidJson": true,');

    expect(res.status).toBe(400);
  });
});
