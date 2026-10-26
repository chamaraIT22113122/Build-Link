import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { VerificationService } from '../services/verification.service';
import { PostService } from '../services/post.service';
import { UserRole, PostType, QuestionStatus, VerificationStatus, DocumentType } from '@buildlink/shared';

const app = createApp();

describe('Phase 5: Construction Question & Answer System & Resolution', () => {
  let authorToken: string;
  let otherUserToken: string;
  let verifiedEngineerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    UserService.clearMemoryStoreForTesting();
    VerificationService.clearMemoryForTesting();
    PostService.clearMemoryForTesting();

    // 1. Author (Homeowner)
    const u1 = await request(app).post('/api/v1/auth/register').send({
      email: 'homeowner.kamal@buildlink.lk',
      password: 'Password123!',
      role: UserRole.USER,
      firstName: 'Kamal',
      lastName: 'Dissanayake',
    });
    authorToken = u1.body.data.token;

    // 2. Another Homeowner
    const u2 = await request(app).post('/api/v1/auth/register').send({
      email: 'neighbor.ruwan@buildlink.lk',
      password: 'Password123!',
      role: UserRole.USER,
      firstName: 'Ruwan',
      lastName: 'Perera',
    });
    otherUserToken = u2.body.data.token;

    // 3. Engineer
    const eng = await request(app).post('/api/v1/auth/register').send({
      email: 'eng.nimali@buildlink.lk',
      password: 'Password123!',
      role: UserRole.ENGINEER,
      firstName: 'Nimali',
      lastName: 'Wickramasinghe',
      engineerTitle: 'Senior Waterproofing Specialist',
      specialization: 'Waterproofing',
    });
    verifiedEngineerToken = eng.body.data.token;

    // 4. Admin
    const adm = await request(app).post('/api/v1/auth/register').send({
      email: 'admin.qa@buildlink.lk',
      password: 'AdminPassword123!',
      role: UserRole.ADMIN,
      firstName: 'QA',
      lastName: 'Admin',
    });
    adminToken = adm.body.data.token;

    // Verify Engineer
    const applyRes = await request(app)
      .post('/api/v1/verification/apply')
      .set('Authorization', `Bearer ${verifiedEngineerToken}`)
      .send({
        registrationBody: 'IESL',
        registrationNumber: 'IESL-M-9912',
        documents: [
          {
            documentType: DocumentType.IESL_MEMBERSHIP_CARD,
            fileUrl: '/uploads/verification/iesl.pdf',
            originalFilename: 'iesl.pdf',
          },
        ],
      });

    await request(app)
      .put(`/api/v1/verification/admin/applications/${applyRes.body.data.id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: VerificationStatus.VERIFIED,
        reviewerNotes: 'Verified for test run.',
      });
  });

  describe('Question Lifecycle & Resolution', () => {
    let questionId: string;
    let commentId: string;

    beforeEach(async () => {
      // 1. Create Question
      const qRes = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Roof slab seepage occurring along construction joints in Nuwara Eliya',
          content: 'Water is dripping through a cold joint during continuous misty rainfall. Which polyurethane sealant or crystalline injection is best?',
          category: 'Waterproofing',
          postType: PostType.QUESTION,
        });
      questionId = qRes.body.data.id;

      // 2. Engineer Answers
      const cRes = await request(app)
        .post(`/api/v1/posts/${questionId}/comments`)
        .set('Authorization', `Bearer ${verifiedEngineerToken}`)
        .send({
          content: 'Cold joint leakage should be treated by V-groove routing (20mm x 20mm), priming, and packing with a non-shrink polyurethane sealant like Sikaflex Construction AP followed by a cementitious crystalline coating.',
        });
      commentId = cRes.body.data.id;
    });

    it('should list question in unresolved catalog', async () => {
      const res = await request(app).get('/api/v1/posts/questions/catalog?status=UNRESOLVED');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(questionId);
      expect(res.body.data[0].isResolved).toBe(false);
    });

    it('should allow author to mark question resolved with accepted answer', async () => {
      const resolveRes = await request(app)
        .put(`/api/v1/posts/${questionId}/resolve`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          acceptedCommentId: commentId,
          resolutionNotes: 'Followed the engineer advice and successfully sealed the joint.',
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.success).toBe(true);
      expect(resolveRes.body.data.isResolved).toBe(true);
      expect(resolveRes.body.data.acceptedAnswerId).toBe(commentId);
      expect(resolveRes.body.data.questionStatus).toBe(QuestionStatus.RESOLVED);

      // Verify comment marked as accepted solution
      const commentsRes = await request(app).get(`/api/v1/posts/${questionId}/comments`);
      expect(commentsRes.body.data[0].isAcceptedSolution).toBe(true);

      // Verify question moves out of UNRESOLVED filter
      const unresolved = await request(app).get('/api/v1/posts/questions/catalog?status=UNRESOLVED');
      expect(unresolved.body.data.length).toBe(0);
    });

    it('should forbid non-author from resolving the question', async () => {
      const res = await request(app)
        .put(`/api/v1/posts/${questionId}/resolve`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ acceptedCommentId: commentId });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow author to reopen question (unresolve)', async () => {
      // First resolve
      await request(app)
        .put(`/api/v1/posts/${questionId}/resolve`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ acceptedCommentId: commentId });

      // Then unresolve
      const unresolveRes = await request(app)
        .put(`/api/v1/posts/${questionId}/unresolve`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(unresolveRes.status).toBe(200);
      expect(unresolveRes.body.data.isResolved).toBe(false);
      expect(unresolveRes.body.data.questionStatus).toBe(QuestionStatus.OPEN);
      expect(unresolveRes.body.data.acceptedAnswerId).toBeUndefined();
    });

    it('should allow users to vote a comment as helpful', async () => {
      // 1. Vote helpful
      const vote1 = await request(app)
        .post(`/api/v1/posts/comments/${commentId}/helpful`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(vote1.status).toBe(200);
      expect(vote1.body.data.isMarkedHelpful).toBe(true);
      expect(vote1.body.data.helpfulCount).toBe(1);

      // 2. Unvote
      const vote2 = await request(app)
        .post(`/api/v1/posts/comments/${commentId}/helpful`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(vote2.status).toBe(200);
      expect(vote2.body.data.isMarkedHelpful).toBe(false);
      expect(vote2.body.data.helpfulCount).toBe(0);
    });
  });
});
