import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { VerificationService } from '../services/verification.service';
import { UserRole, VerificationStatus, DocumentType } from '@buildlink/shared';

const app = createApp();

describe('Phase 3: Professional Registration, Credential Verification & Audit', () => {
  let engineerToken: string;
  let homeownerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    UserService.clearMemoryStoreForTesting();
    VerificationService.clearMemoryForTesting();

    // 1. Create Engineer User
    const engRes = await request(app).post('/api/v1/auth/register').send({
      email: 'eng.mahesh@buildlink.lk',
      password: 'StrongPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Mahesh',
      lastName: 'Fernando',
      engineerTitle: 'Senior Geotechnical Engineer',
      specialization: 'Foundations',
    });
    engineerToken = engRes.body.data.token;

    // 2. Create Homeowner User
    const homeRes = await request(app).post('/api/v1/auth/register').send({
      email: 'anura.builder@example.com',
      password: 'HomeownerPass123!',
      role: UserRole.USER,
      firstName: 'Anura',
      lastName: 'Bandara',
    });
    homeownerToken = homeRes.body.data.token;

    // 3. Create Admin User
    const adminRes = await request(app).post('/api/v1/auth/register').send({
      email: 'chief.auditor@buildlink.lk',
      password: 'AdminPassword123!',
      role: UserRole.ADMIN,
      firstName: 'Auditor',
      lastName: 'General',
    });
    adminToken = adminRes.body.data.token;
  });

  describe('Document Upload API', () => {
    it('should upload a valid certificate file (PDF/Image)', async () => {
      const buffer = Buffer.from('Mock certificate content for test verification');

      const res = await request(app)
        .post('/api/v1/verification/upload')
        .set('Authorization', `Bearer ${engineerToken}`)
        .attach('document', buffer, 'iesl_certificate.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileUrl).toContain('/uploads/verification/');
      expect(res.body.data.originalFilename).toBe('iesl_certificate.pdf');
    });

    it('should reject file upload without attachment', async () => {
      const res = await request(app)
        .post('/api/v1/verification/upload')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NO_FILE_UPLOADED');
    });
  });

  describe('Verification Application Submission', () => {
    it('should allow an engineer to submit credentials for review', async () => {
      const applicationPayload = {
        registrationBody: 'IESL (Institution of Engineers, Sri Lanka)',
        registrationNumber: 'IESL-M-10294',
        notes: 'Chartered structural member since 2018 with extensive residential high-rise experience.',
        documents: [
          {
            documentType: DocumentType.IESL_MEMBERSHIP_CARD,
            fileUrl: '/uploads/verification/iesl_card.pdf',
            originalFilename: 'iesl_card.pdf',
            fileSizeBytes: 245000,
          },
          {
            documentType: DocumentType.DEGREE_CERTIFICATE,
            fileUrl: '/uploads/verification/mora_bsc_civil.pdf',
            originalFilename: 'mora_bsc_civil.pdf',
            fileSizeBytes: 620000,
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/verification/apply')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send(applicationPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VerificationStatus.PENDING_REVIEW);
      expect(res.body.data.registrationNumber).toBe('IESL-M-10294');
      expect(res.body.data.documents.length).toBe(2);

      // Verify engineer's current status endpoint
      const statusRes = await request(app)
        .get('/api/v1/verification/status')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe(VerificationStatus.PENDING_REVIEW);
      expect(statusRes.body.data.documents[0].documentType).toBe(DocumentType.IESL_MEMBERSHIP_CARD);
    });

    it('should reject verification application from regular homeowner', async () => {
      const res = await request(app)
        .post('/api/v1/verification/apply')
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          registrationBody: 'IESL',
          registrationNumber: 'FAKE-123',
          documents: [
            {
              documentType: DocumentType.OTHER,
              fileUrl: '/uploads/verification/fake.pdf',
              originalFilename: 'fake.pdf',
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Admin Review & Audit Logs', () => {
    let applicationId: string;

    beforeEach(async () => {
      const appRes = await request(app)
        .post('/api/v1/verification/apply')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          registrationBody: 'IESL',
          registrationNumber: 'IESL-M-9021',
          documents: [
            {
              documentType: DocumentType.IESL_MEMBERSHIP_CARD,
              fileUrl: '/uploads/verification/iesl.pdf',
              originalFilename: 'iesl.pdf',
            },
          ],
        });
      applicationId = appRes.body.data.id;
    });

    it('should allow admin to list pending applications', async () => {
      const res = await request(app)
        .get('/api/v1/verification/admin/applications?status=PENDING_REVIEW')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(applicationId);
    });

    it('should allow admin to approve engineer and grant VERIFIED status', async () => {
      const reviewRes = await request(app)
        .put(`/api/v1/verification/admin/applications/${applicationId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: VerificationStatus.VERIFIED,
          reviewerNotes: 'IESL membership number and good standing verified against public roll.',
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.data.status).toBe(VerificationStatus.VERIFIED);
      expect(reviewRes.body.data.reviewerNotes).toContain('public roll');

      // Verify engineer profile reflects the approved verification status
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(meRes.body.data.engineerProfile.verificationStatus).toBe(VerificationStatus.VERIFIED);
    });

    it('should maintain immutable audit log trail of submissions and reviews', async () => {
      // 1. Perform review
      await request(app)
        .put(`/api/v1/verification/admin/applications/${applicationId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: VerificationStatus.VERIFIED,
          reviewerNotes: 'Verified and approved.',
        });

      // 2. Fetch Audit Logs as Admin
      const auditRes = await request(app)
        .get('/api/v1/verification/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.success).toBe(true);
      expect(Array.isArray(auditRes.body.data)).toBe(true);

      const actions = auditRes.body.data.map((l: { action: string }) => l.action);
      expect(actions).toContain('VERIFICATION_APPLICATION_SUBMITTED');
      expect(actions).toContain('VERIFICATION_APPLICATION_REVIEWED');
    });

    it('should reject non-admin from accessing admin verification and audit endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/verification/admin/audit-logs')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
