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

describe('Phase 6: Professional Directory, Search, Filters & Matching', () => {
  let engineerToken: string;
  let engineerUserId: string;
  let engineerProfileId: string;

  let homeownerToken: string;
  let homeownerUserId: string;

  let otherToken: string;

  beforeAll(async () => {
    UserService.clearMemoryStoreForTesting();
    EngineerService.clearMemoryForTesting();

    // 1. Register an Engineer
    const engRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'kamal.silva@buildlink.lk',
        password: 'Password123!',
        role: UserRole.ENGINEER,
        firstName: 'Kamal',
        lastName: 'Silva',
        district: 'Colombo',
        city: 'Colombo 03',
        engineerTitle: 'Senior Chartered Structural Engineer',
        specialization: 'Structural Analysis',
      });

    expect(engRes.status).toBe(201);
    engineerToken = engRes.body.data.token;
    engineerUserId = engRes.body.data.user.id;
    engineerProfileId = engRes.body.data.user.engineerProfile.id;

    // Set additional engineer details in memory store for directory testing
    const memory = UserService.getMemoryStore();
    const record = memory.get(engineerUserId);
    if (record && record.engineerProfile) {
      record.engineerProfile.verificationStatus = VerificationStatus.VERIFIED;
      record.engineerProfile.specializations = JSON.stringify(['Structural Analysis', 'High-Rise Concrete', 'Foundation Design']);
      record.engineerProfile.yearsOfExperience = 14;
      record.engineerProfile.consultationFee = 7500;
      record.engineerProfile.ratingAverage = 4.9;
      record.engineerProfile.ratingCount = 28;
    }

    // 2. Register a Homeowner
    const homeRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'sunil.perera@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        firstName: 'Sunil',
        lastName: 'Perera',
        district: 'Gampaha',
        city: 'Negombo',
      });

    expect(homeRes.status).toBe(201);
    homeownerToken = homeRes.body.data.token;
    homeownerUserId = homeRes.body.data.user.id;

    // 3. Register a 3rd User
    const otherRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other.user@buildlink.lk',
        password: 'Password123!',
        role: UserRole.USER,
        firstName: 'Nimal',
        lastName: 'Fernando',
      });
    expect(otherRes.status).toBe(201);
    otherToken = otherRes.body.data.token;
  });

  describe('Engineer Public Directory & Search API', () => {
    it('should list verified engineers in directory', async () => {
      const res = await request(app).get('/api/v1/engineers?verifiedOnly=true');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const eng = res.body.data.find((e: any) => e.userId === engineerUserId);
      expect(eng).toBeDefined();
      expect(eng.title).toContain('Structural Engineer');
      expect(eng.isVerified).toBe(true);
      expect(eng.specializations).toContain('Structural Analysis');
    });

    it('should filter engineers by specialization keyword', async () => {
      const res = await request(app).get('/api/v1/engineers?specialization=Foundation');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].userId).toBe(engineerUserId);
    });

    it('should filter engineers by district', async () => {
      const colomboRes = await request(app).get('/api/v1/engineers?district=Colombo');
      expect(colomboRes.status).toBe(200);
      expect(colomboRes.body.data.length).toBeGreaterThanOrEqual(1);

      const kandyRes = await request(app).get('/api/v1/engineers?district=Jaffna');
      expect(kandyRes.status).toBe(200);
      expect(kandyRes.body.data.length).toBe(0);
    });

    it('should fetch public engineer details by ID', async () => {
      const res = await request(app).get(`/api/v1/engineers/${engineerProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(engineerProfileId);
      expect(res.body.data.displayName).toBe('Kamal Silva');
      expect(res.body.data.consultationFee).toBe(7500);
    });
  });

  describe('Consultation Request & Matching Lifecycle', () => {
    let consultationId: string;

    it('should allow homeowner to book a consultation request', async () => {
      const res = await request(app)
        .post('/api/v1/engineers/consultations')
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          engineerId: engineerProfileId,
          consultationType: ConsultationType.ONSITE,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          problemDescription: 'Need on-site foundation inspection for 2-story residence in Negombo.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ConsultationStatus.REQUESTED);
      expect(res.body.data.clientId).toBe(homeownerUserId);
      expect(res.body.data.engineerId).toBe(engineerProfileId);
      consultationId = res.body.data.id;
    });

    it('should list consultation under homeowner and engineer my consultations', async () => {
      // Check for homeowner
      const clientRes = await request(app)
        .get('/api/v1/engineers/consultations/my')
        .set('Authorization', `Bearer ${homeownerToken}`);

      expect(clientRes.status).toBe(200);
      expect(clientRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(clientRes.body.data[0].id).toBe(consultationId);

      // Check for engineer
      const engRes = await request(app)
        .get('/api/v1/engineers/consultations/my')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(engRes.status).toBe(200);
      expect(engRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(engRes.body.data[0].id).toBe(consultationId);
    });

    it('should allow engineer to accept the consultation', async () => {
      const res = await request(app)
        .put(`/api/v1/engineers/consultations/${consultationId}/status`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ status: ConsultationStatus.ACCEPTED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ConsultationStatus.ACCEPTED);
    });

    it('should forbid unauthorized 3rd user from modifying consultation', async () => {
      const res = await request(app)
        .put(`/api/v1/engineers/consultations/${consultationId}/status`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: ConsultationStatus.CANCELLED });

      expect(res.status).toBe(403);
    });
  });
});
