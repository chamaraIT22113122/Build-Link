import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { UserRole } from '@buildlink/shared';

const app = createApp();

describe('Phase 2: Authentication, Roles & Profile Management', () => {
  beforeEach(() => {
    UserService.clearMemoryStoreForTesting();
  });

  const homeownerData = {
    email: 'nimal.perera@example.com',
    password: 'Password123!',
    role: UserRole.USER,
    firstName: 'Nimal',
    lastName: 'Perera',
  };

  const engineerData = {
    email: 'eng.sunil@buildlink.lk',
    password: 'EngineerPass123!',
    role: UserRole.ENGINEER,
    firstName: 'Sunil',
    lastName: 'Jayawardena',
    engineerTitle: 'Senior Structural Engineer',
    specialization: 'Structural Engineering',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new homeowner successfully with JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(homeownerData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(homeownerData.email.toLowerCase());
      expect(res.body.data.user.role).toBe(UserRole.USER);
      expect(res.body.data.user.profile.firstName).toBe('Nimal');
      expect(res.body.data.user.profile.lastName).toBe('Perera');
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
      // Ensure password hash is NEVER exposed
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should register an engineer with professional profile details', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(engineerData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe(UserRole.ENGINEER);
      expect(res.body.data.user.engineerProfile).toBeDefined();
      expect(res.body.data.user.engineerProfile.title).toBe(engineerData.engineerTitle);
      expect(res.body.data.user.engineerProfile.specializations).toContain(engineerData.specialization);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration when email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(homeownerData);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(homeownerData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject registration with invalid email or weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'short',
          firstName: 'A',
          lastName: 'B',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(homeownerData);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: homeownerData.email,
        password: homeownerData.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(homeownerData.email.toLowerCase());
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: homeownerData.email,
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'unknown@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me & Protected Routes', () => {
    let token: string;

    beforeEach(async () => {
      const reg = await request(app).post('/api/v1/auth/register').send(homeownerData);
      token = reg.body.data.token;
    });

    it('should return authenticated user profile when token is valid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(homeownerData.email.toLowerCase());
      expect(res.body.data.profile.firstName).toBe('Nimal');
    });

    it('should return 401 when Authorization header is omitted', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when token is tampered or invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.signature');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Profile Management & Role-Based Access Control', () => {
    let homeownerToken: string;
    let engineerToken: string;

    beforeEach(async () => {
      const homeRes = await request(app).post('/api/v1/auth/register').send(homeownerData);
      homeownerToken = homeRes.body.data.token;

      const engRes = await request(app).post('/api/v1/auth/register').send(engineerData);
      engineerToken = engRes.body.data.token;
    });

    it('should allow user to update their personal profile info', async () => {
      const updateData = {
        city: 'Colombo',
        district: 'Colombo',
        bio: 'Building a modern 2-story home in Battaramulla.',
        phoneNumber: '+94771234567',
      };

      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.city).toBe('Colombo');
      expect(res.body.data.profile.district).toBe('Colombo');
      expect(res.body.data.profile.bio).toBe('Building a modern 2-story home in Battaramulla.');
      expect(res.body.data.profile.phoneNumber).toBe('+94771234567');
    });

    it('should allow an engineer to update their professional details', async () => {
      const engUpdate = {
        title: 'Chartered Structural Engineer',
        yearsOfExperience: 12,
        consultationFee: 7500,
        registrationBody: 'IESL',
        registrationNumber: 'IESL-M-8912',
        specializations: ['Structural Engineering', 'Foundations', 'Building Maintenance'],
        availableForConsultation: true,
      };

      const res = await request(app)
        .put('/api/v1/users/engineer-profile')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send(engUpdate);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.engineerProfile.title).toBe('Chartered Structural Engineer');
      expect(res.body.data.engineerProfile.yearsOfExperience).toBe(12);
      expect(res.body.data.engineerProfile.consultationFee).toBe(7500);
      expect(res.body.data.engineerProfile.registrationBody).toBe('IESL');
      expect(res.body.data.engineerProfile.specializations).toContain('Foundations');
    });

    it('should forbid homeowner from accessing engineer profile update endpoint (RBAC)', async () => {
      const res = await request(app)
        .put('/api/v1/users/engineer-profile')
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({ title: 'Imposter' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow user to change their password securely', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          currentPassword: homeownerData.password,
          newPassword: 'BrandNewSecurePassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with old password fails
      const oldLogin = await request(app).post('/api/v1/auth/login').send({
        email: homeownerData.email,
        password: homeownerData.password,
      });
      expect(oldLogin.status).toBe(401);

      // Verify login with new password succeeds
      const newLogin = await request(app).post('/api/v1/auth/login').send({
        email: homeownerData.email,
        password: 'BrandNewSecurePassword456!',
      });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);
    });

    it('should handle logout endpoint gracefully', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
