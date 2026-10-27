import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { EngineerService } from '../services/engineer.service';
import {
  UserRole,
  VerificationStatus,
  ConsultationStatus,
  ConsultationType,
} from '@buildlink/shared';

const app = createApp();

describe('Phase 9: Real-time Consultations, In-app Messaging & Review Ratings', () => {
  let engineerToken: string;
  let engineerUserId: string;
  let engineerProfileId: string;

  let homeownerToken: string;
  let homeownerUserId: string;

  let consultationId: string;

  beforeAll(async () => {
    UserService.clearMemoryStoreForTesting();
    EngineerService.clearMemoryForTesting();

    // 1. Register an Engineer
    const engRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'chartered.saman@buildlink.lk',
        password: 'Password123!',
        role: UserRole.ENGINEER,
        firstName: 'Saman',
        lastName: 'Perera',
        district: 'Kandy',
        city: 'Peradeniya',
        engineerTitle: 'Chartered Geotechnical Engineer',
        specialization: 'NBRO Slope Stability & Foundation',
      });

    expect(engRes.status).toBe(201);
    engineerToken = engRes.body.data.token;
    engineerUserId = engRes.body.data.user.id;
    engineerProfileId = engRes.body.data.user.engineerProfile.id;

    // Verify engineer profile in memory
    const memory = UserService.getMemoryStore();
    const record = memory.get(engineerUserId);
    if (record && record.engineerProfile) {
      record.engineerProfile.verificationStatus = VerificationStatus.VERIFIED;
      record.engineerProfile.ratingAverage = 0;
      record.engineerProfile.ratingCount = 0;
    }

    // 2. Register a Homeowner / Client
    const homeRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dilshan.client@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        firstName: 'Dilshan',
        lastName: 'Wijerathne',
        district: 'Kandy',
        city: 'Kandy Town',
      });

    expect(homeRes.status).toBe(201);
    homeownerToken = homeRes.body.data.token;
    homeownerUserId = homeRes.body.data.user.id;

    // 3. Create a consultation
    const consRes = await request(app)
      .post('/api/v1/engineers/consultations')
      .set('Authorization', `Bearer ${homeownerToken}`)
      .send({
        engineerId: engineerProfileId,
        consultationType: ConsultationType.ONSITE,
        problemDescription: 'Retaining wall structural cracks along hillside property in Peradeniya.',
      });

    expect(consRes.status).toBe(201);
    consultationId = consRes.body.data.id;
  });

  describe('Consultation In-App Messaging', () => {
    it('allows client to post a message to the consultation thread', async () => {
      const res = await request(app)
        .post(`/api/v1/engineers/consultations/${consultationId}/messages`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          content: 'Hello Eng. Saman, I have uploaded the NBRO slope contour maps for your review.',
          attachments: ['https://storage.buildlink.lk/docs/nbro_slope_map.pdf'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('NBRO slope contour');
      expect(res.body.data.senderId).toBe(homeownerUserId);
      expect(res.body.data.attachments).toHaveLength(1);
    });

    it('allows engineer to reply to the consultation thread', async () => {
      const res = await request(app)
        .post(`/api/v1/engineers/consultations/${consultationId}/messages`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          content: 'Thank you Dilshan. I reviewed the contour. We will inspect soil drainage on Saturday.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.senderId).toBe(engineerUserId);
      expect(res.body.data.senderRole).toBe(UserRole.ENGINEER);
    });

    it('retrieves the message thread in chronological order', async () => {
      const res = await request(app)
        .get(`/api/v1/engineers/consultations/${consultationId}/messages`)
        .set('Authorization', `Bearer ${homeownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].content).toContain('NBRO slope contour');
      expect(res.body.data[1].content).toContain('reviewed the contour');
    });

    it('rejects message with empty content', async () => {
      const res = await request(app)
        .post(`/api/v1/engineers/consultations/${consultationId}/messages`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          content: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unauthenticated message submission', async () => {
      const res = await request(app)
        .post(`/api/v1/engineers/consultations/${consultationId}/messages`)
        .send({
          content: 'Unauthenticated message attempt',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Engineer Ratings & Verified Reviews', () => {
    it('allows verified client to submit a 5-star review', async () => {
      const res = await request(app)
        .post(`/api/v1/engineers/${engineerProfileId}/reviews`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          rating: 5,
          reviewText: 'Eng. Saman provided an outstanding NBRO geotechnical site inspection report with clear retaining wall specifications.',
          consultationId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.isVerifiedClient).toBe(true);
      expect(res.body.data.clientName).toContain('Dilshan');
    });

    it('recalculates engineer profile average rating and rating count', async () => {
      const res = await request(app).get(`/api/v1/engineers/${engineerProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.ratingAverage).toBe(5);
      expect(res.body.data.ratingCount).toBe(1);
    });

    it('lists all reviews for the engineer', async () => {
      const res = await request(app).get(`/api/v1/engineers/${engineerProfileId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].reviewText).toContain('geotechnical site inspection');
    });

    it('rejects review with invalid rating score outside 1-5', async () => {
      const res = await request(app)
        .post(`/api/v1/engineers/${engineerProfileId}/reviews`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          rating: 6,
          reviewText: 'Invalid score test',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects review with empty or too short text', async () => {
      const res = await request(app)
        .post(`/api/v1/engineers/${engineerProfileId}/reviews`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          rating: 4,
          reviewText: 'Hi',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
