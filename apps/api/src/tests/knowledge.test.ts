import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { KnowledgeService } from '../services/knowledge.service';
import { UserRole } from '@buildlink/shared';

const app = createApp();

describe('Phase 8: Knowledge Hub & Sri Lankan Construction Standards', () => {
  let engineerToken: string;

  beforeAll(async () => {
    UserService.clearMemoryStoreForTesting();
    KnowledgeService.clearMemoryForTesting();

    // Register an Engineer Author
    const engRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'eng.sarath@buildlink.lk',
        password: 'Password123!',
        role: UserRole.ENGINEER,
        firstName: 'Sarath',
        lastName: 'Wanniarachchi',
        district: 'Colombo',
        city: 'Moratuwa',
        engineerTitle: 'Principal Materials Engineer',
        specialization: 'Concrete & Masonry Technology',
      });

    expect(engRes.status).toBe(201);
    engineerToken = engRes.body.data.token;
  });

  describe('Knowledge Articles Catalog & Standards Search', () => {
    it('should list pre-seeded Sri Lankan standards technical guides', async () => {
      const res = await request(app).get('/api/v1/knowledge');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);

      const slsArticle = res.body.data.find(
        (a: any) => a.slug === 'sls-1253-concrete-mix-proportions'
      );
      expect(slsArticle).toBeDefined();
      expect(slsArticle.standardsReference).toContain('SLS 1253');
      expect(slsArticle.category).toBe('Concrete Technology');
    });

    it('should filter articles by technical category', async () => {
      const res = await request(app).get('/api/v1/knowledge?category=Structural Design');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].category).toBe('Structural Design');
      expect(res.body.data[0].standardsReference).toContain('CIDA');
    });

    it('should filter articles by Sri Lankan standards authority reference', async () => {
      const nbroRes = await request(app).get('/api/v1/knowledge?standardsReference=NBRO');
      expect(nbroRes.status).toBe(200);
      expect(nbroRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(nbroRes.body.data[0].standardsReference).toContain('NBRO');

      const udaRes = await request(app).get('/api/v1/knowledge?standardsReference=UDA');
      expect(udaRes.status).toBe(200);
      expect(udaRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(udaRes.body.data[0].standardsReference).toContain('UDA');
    });

    it('should fetch article details by slug and increment views count', async () => {
      const slug = 'sls-1253-concrete-mix-proportions';
      const res = await request(app).get(`/api/v1/knowledge/${slug}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(slug);
      expect(res.body.data.content).toContain('SLS 1253');
      expect(res.body.data.readingTimeMinutes).toBeGreaterThan(0);
      expect(res.body.data.viewsCount).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent article slug', async () => {
      const res = await request(app).get('/api/v1/knowledge/non-existent-standard-slug');
      expect(res.status).toBe(404);
    });
  });

  describe('Technical Guide Authoring & Publishing', () => {
    it('should allow authenticated engineer to publish a new technical article', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          title: 'SLS 107: Wire-Cut Clay Bricks vs Cement Sand Blocks in Wet Zone Slabs',
          category: 'Building Materials',
          summary: 'Comparison of thermal mass, compressive strength, and moisture absorption according to SLS 107.',
          content: 'In Western and Sabaragamuwa wet zones, high-density wire cut burnt clay bricks provide superior capillary resistance compared to un-cured cement hollow blocks.',
          standardsReference: 'SLS 107 / SLS 855',
          tags: ['SLS 107', 'Bricks', 'Masonry', 'Wet Zone'],
          readingTimeMinutes: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('SLS 107');
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.standardsReference).toBe('SLS 107 / SLS 855');
    });

    it('should reject article creation without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge')
        .send({
          title: 'Unauthenticated Article',
          category: 'General',
          summary: 'Test summary',
          content: 'Test content',
        });

      expect(res.status).toBe(401);
    });
  });
});
