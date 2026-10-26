import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { ProjectService } from '../services/project.service';
import {
  UserRole,
  VerificationStatus,
  ProjectStage,
} from '@buildlink/shared';

const app = createApp();

describe('Phase 7: Project Tracking, Construction Milestones & Collaboration', () => {
  let homeownerToken: string;
  let homeownerUserId: string;

  let engineerToken: string;
  let engineerUserId: string;
  let engineerProfileId: string;

  let otherToken: string;
  let projectId: string;
  let foundationMilestoneId: string;

  beforeAll(async () => {
    UserService.clearMemoryStoreForTesting();
    ProjectService.clearMemoryForTesting();

    // 1. Register an Engineer
    const engRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'eng.mahesh@buildlink.lk',
        password: 'Password123!',
        role: UserRole.ENGINEER,
        firstName: 'Mahesh',
        lastName: 'Gunawardena',
        district: 'Kandy',
        city: 'Kandy',
        engineerTitle: 'Senior Chartered Structural Engineer',
        specialization: 'Structural & Foundation Engineering',
      });

    expect(engRes.status).toBe(201);
    engineerToken = engRes.body.data.token;
    engineerUserId = engRes.body.data.user.id;
    engineerProfileId = engRes.body.data.user.engineerProfile.id;

    // Mark engineer as verified
    const memory = UserService.getMemoryStore();
    const record = memory.get(engineerUserId);
    if (record && record.engineerProfile) {
      record.engineerProfile.verificationStatus = VerificationStatus.VERIFIED;
    }

    // 2. Register Homeowner
    const homeRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'anura.kumara@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        firstName: 'Anura',
        lastName: 'Kumara',
        district: 'Kandy',
        city: 'Peradeniya',
      });

    expect(homeRes.status).toBe(201);
    homeownerToken = homeRes.body.data.token;
    homeownerUserId = homeRes.body.data.user.id;

    // 3. Register Other User
    const otherRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other.thirdparty@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        firstName: 'Third',
        lastName: 'Party',
      });
    otherToken = otherRes.body.data.token;
  });

  describe('Project Creation & Default Milestones Scaffolding', () => {
    it('should create a new construction project with default stage milestones', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          title: 'Two-Story Residence in Peradeniya',
          description: 'Contemporary 3,200 sq ft eco-friendly home with deep concrete pile foundation.',
          location: '14/B Galaha Road, Peradeniya',
          district: 'Kandy',
          stage: ProjectStage.PLANNING,
          estimatedBudget: 18500000,
          assignedEngineerId: engineerProfileId,
          startDate: new Date().toISOString(),
          targetCompletionDate: new Date(Date.now() + 180 * 86400000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Two-Story Residence in Peradeniya');
      expect(res.body.data.stage).toBe(ProjectStage.PLANNING);
      expect(res.body.data.estimatedBudget).toBe(18500000);
      expect(Array.isArray(res.body.data.milestones)).toBe(true);
      expect(res.body.data.milestones.length).toBeGreaterThanOrEqual(8);

      projectId = res.body.data.id;
      const foundMilestone = res.body.data.milestones.find(
        (m: any) => m.stage === ProjectStage.FOUNDATION
      );
      expect(foundMilestone).toBeDefined();
      foundationMilestoneId = foundMilestone.id;
    });

    it('should list user projects under active projects', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${homeownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(projectId);
      expect(res.body.data[0].totalMilestonesCount).toBeGreaterThan(0);
    });

    it('should fetch project details by ID with milestone progress', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${homeownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(projectId);
      expect(res.body.data.milestones).toBeDefined();
    });

    it('should forbid non-participant user from viewing private project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Milestone Progression & Engineer Sign-Off Certification', () => {
    it('should allow owner to update project stage and expenditure', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          stage: ProjectStage.FOUNDATION,
          actualSpent: 2800000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stage).toBe(ProjectStage.FOUNDATION);
      expect(res.body.data.actualSpent).toBe(2800000);
    });

    it('should allow adding custom milestone to project', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/milestones`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          stage: ProjectStage.FOUNDATION,
          title: 'Sub-soil Anti-Termite Injection & Heavy Gauge Polythene Damp Proofing',
          description: 'Apply approved chemical barrier before blinding concrete pour.',
          targetDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('Anti-Termite');
      expect(res.body.data.isCompleted).toBe(false);
    });

    it('should allow homeowner to mark milestone as completed', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${projectId}/milestones/${foundationMilestoneId}`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({ isCompleted: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCompleted).toBe(true);
      expect(res.body.data.isSignedOffByEngineer).toBe(false);
    });

    it('should allow verified engineer to certify and sign off milestone', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${projectId}/milestones/${foundationMilestoneId}/sign-off`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          notes: 'Inspected rebar reinforcement diameter (T16/T12) and clear cover of 50mm. Ready for C25/30 ready-mix concrete pouring.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSignedOffByEngineer).toBe(true);
      expect(res.body.data.signedOffByEngineerId).toBe(engineerProfileId);
      expect(res.body.data.engineerNotes).toContain('Ready for C25/30');
    });

    it('should reject non-engineer from signing off a milestone', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${projectId}/milestones/${foundationMilestoneId}/sign-off`)
        .set('Authorization', `Bearer ${homeownerToken}`)
        .send({
          notes: 'Attempting to self-sign',
        });

      expect(res.status).toBe(403);
    });
  });
});
