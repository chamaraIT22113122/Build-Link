import request from 'supertest';
import { createApp } from '../app';

describe('Health and System Routes', () => {
  const app = createApp();

  it('GET /api/v1/health returns 200 with system metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('service', 'BuildLink Core API');
    expect(res.body.data).toHaveProperty('version', '1.0.0');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data.database).toHaveProperty('engine', 'Microsoft SQL Server 2025 Express');
  });

  it('GET /unknown-route returns 404 with structured error', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
