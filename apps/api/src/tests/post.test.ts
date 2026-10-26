import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { VerificationService } from '../services/verification.service';
import { PostService } from '../services/post.service';
import { UserRole, PostType, VerificationStatus, DocumentType } from '@buildlink/shared';

const app = createApp();

describe('Phase 4: Social Community Feed, Media, Likes & Comments', () => {
  let userToken: string;
  let otherUserToken: string;
  let verifiedEngineerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    UserService.clearMemoryStoreForTesting();
    VerificationService.clearMemoryForTesting();
    PostService.clearMemoryForTesting();

    // 1. Homeowner 1
    const u1 = await request(app).post('/api/v1/auth/register').send({
      email: 'builder.kasun@buildlink.lk',
      password: 'StrongPassword123!',
      role: UserRole.USER,
      firstName: 'Kasun',
      lastName: 'Wijekoon',
    });
    userToken = u1.body.data.token;

    // 2. Homeowner 2
    const u2 = await request(app).post('/api/v1/auth/register').send({
      email: 'builder.chathura@buildlink.lk',
      password: 'StrongPassword123!',
      role: UserRole.USER,
      firstName: 'Chathura',
      lastName: 'Silva',
    });
    otherUserToken = u2.body.data.token;

    // 3. Engineer User
    const eng = await request(app).post('/api/v1/auth/register').send({
      email: 'eng.sarath@buildlink.lk',
      password: 'StrongPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Sarath',
      lastName: 'Gunaratne',
      engineerTitle: 'Senior Structural Engineer',
      specialization: 'Structural Engineering',
    });
    verifiedEngineerToken = eng.body.data.token;

    // 4. Admin User
    const adm = await request(app).post('/api/v1/auth/register').send({
      email: 'super.admin@buildlink.lk',
      password: 'AdminPassword123!',
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    });
    adminToken = adm.body.data.token;

    // Verify the engineer via Phase 3 workflow so they have VERIFIED badge
    const applyRes = await request(app)
      .post('/api/v1/verification/apply')
      .set('Authorization', `Bearer ${verifiedEngineerToken}`)
      .send({
        registrationBody: 'IESL',
        registrationNumber: 'IESL-M-7712',
        documents: [
          {
            documentType: DocumentType.IESL_MEMBERSHIP_CARD,
            fileUrl: '/uploads/verification/iesl.pdf',
            originalFilename: 'iesl.pdf',
          },
        ],
      });
    const appId = applyRes.body.data.id;

    await request(app)
      .put(`/api/v1/verification/admin/applications/${appId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: VerificationStatus.VERIFIED,
        reviewerNotes: 'Approved during test setup',
      });
  });

  describe('Post Creation & Feed', () => {
    it('should create a new post with category and attachments', async () => {
      const payload = {
        title: 'Cracks appearing in ground floor masonry walls after heavy monsoon rain',
        content: 'Noticed hairline vertical cracks near lintel levels in our 2-story house in Gampaha. Should we be concerned about settlement or foundation shifting?',
        category: 'Foundations',
        postType: PostType.QUESTION,
        mediaUrls: ['/uploads/verification/lintel_crack1.jpg', '/uploads/verification/lintel_crack2.jpg'],
      };

      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.category).toBe('Foundations');
      expect(res.body.data.postType).toBe(PostType.QUESTION);
      expect(res.body.data.mediaUrls.length).toBe(2);
      expect(res.body.data.author.displayName).toBe('Kasun Wijekoon');
      expect(res.body.data.likesCount).toBe(0);
      expect(res.body.data.commentsCount).toBe(0);
    });

    it('should list posts with category filter', async () => {
      await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Post about roofing tile choices in tropical climate',
          content: 'Comparing clay tiles vs asphalt shingles for thermal insulation.',
          category: 'Roofing',
          postType: PostType.TIP,
        });

      await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Concrete curing time in hot weather',
          content: 'Keep wet hessian for at least 7 days.',
          category: 'Foundations',
          postType: PostType.TIP,
        });

      const res = await request(app).get('/api/v1/posts?category=Roofing');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('Roofing');
    });

    it('should get post by ID', async () => {
      const created = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Testing single post view',
          content: 'Detailed description of structural beam layout.',
          category: 'Structural Engineering',
        });

      const postId = created.body.data.id;
      const res = await request(app).get(`/api/v1/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(postId);
    });

    it('should reject post update by non-author user', async () => {
      const created = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Author only post',
          content: 'Original content.',
          category: 'Other',
        });

      const postId = created.body.data.id;

      const res = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Hijacked title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Post Likes Toggle', () => {
    let postId: string;

    beforeEach(async () => {
      const created = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Post to test like counter',
          content: 'Interesting building method.',
          category: 'Structural Engineering',
        });
      postId = created.body.data.id;
    });

    it('should toggle like on and off idempotently', async () => {
      // 1. First like -> count becomes 1
      const like1 = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(like1.status).toBe(200);
      expect(like1.body.data.isLiked).toBe(true);
      expect(like1.body.data.likesCount).toBe(1);

      // Verify post detail reflects like
      const detail1 = await request(app)
        .get(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(detail1.body.data.isLikedByMe).toBe(true);
      expect(detail1.body.data.likesCount).toBe(1);

      // 2. Second like (same user) -> unlike, count reverts to 0
      const like2 = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(like2.status).toBe(200);
      expect(like2.body.data.isLiked).toBe(false);
      expect(like2.body.data.likesCount).toBe(0);
    });
  });

  describe('Comments & Verified Professional Answers', () => {
    let postId: string;

    beforeEach(async () => {
      const created = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Question regarding foundation depth in clay soil',
          content: 'What is the recommended footing depth for black cotton clay?',
          category: 'Foundations',
          postType: PostType.QUESTION,
        });
      postId = created.body.data.id;
    });

    it('should add comment from regular homeowner', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          content: 'We had similar clay soil in Kalutara and used pad footings with gravel backfill.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('similar clay soil');
      expect(res.body.data.isProfessionalAnswer).toBe(false);
      expect(res.body.data.author.isVerifiedEngineer).toBe(false);
    });

    it('should automatically mark verified engineer comment as a professional answer', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${verifiedEngineerToken}`)
        .send({
          content: 'Black cotton soil requires strip footings or raft foundations taken below the active moisture movement zone (typically at least 1.5m depth). Recommend a soil boring test before laying concrete.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isProfessionalAnswer).toBe(true);
      expect(res.body.data.author.isVerifiedEngineer).toBe(true);
      expect(res.body.data.author.engineerTitle).toBe('Senior Structural Engineer');

      // Check comments list
      const list = await request(app).get(`/api/v1/posts/${postId}/comments`);
      expect(list.status).toBe(200);
      expect(list.body.data.length).toBe(1);
      expect(list.body.data[0].isProfessionalAnswer).toBe(true);
    });

    it('should allow author or admin to delete comment', async () => {
      const added = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ content: 'Temporary note to delete.' });

      const commentId = added.body.data.id;

      // Delete by author
      const del = await request(app)
        .delete(`/api/v1/posts/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(del.status).toBe(200);
      expect(del.body.success).toBe(true);

      const check = await request(app).get(`/api/v1/posts/${postId}/comments`);
      expect(check.body.data.length).toBe(0);
    });
  });
});
