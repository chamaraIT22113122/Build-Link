import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { authenticateJwt, optionalAuthenticateJwt } from '../middleware/auth.middleware';
import { uploadVerificationDocs } from '../middleware/upload.middleware';

const router = Router();

// Upload post media / site photos
router.post(
  '/upload',
  authenticateJwt,
  uploadVerificationDocs.single('image'),
  PostController.uploadMedia
);

// Dedicated Q&A Questions Listing
router.get('/questions/catalog', optionalAuthenticateJwt, PostController.listQuestions);

// Feed & Post CRUD
router.get('/', optionalAuthenticateJwt, PostController.listPosts);
router.post('/', authenticateJwt, PostController.createPost);
router.get('/:id', optionalAuthenticateJwt, PostController.getPostById);
router.put('/:id', authenticateJwt, PostController.updatePost);
router.delete('/:id', authenticateJwt, PostController.deletePost);

// Question Resolution & Accepted Answers
router.put('/:id/resolve', authenticateJwt, PostController.resolveQuestion);
router.put('/:id/unresolve', authenticateJwt, PostController.unresolveQuestion);

// Post Likes (toggle)
router.post('/:id/like', authenticateJwt, PostController.toggleLike);

// Comments & Helpful Answer Endorsement
router.post('/:id/comments', authenticateJwt, PostController.addComment);
router.get('/:id/comments', PostController.getComments);
router.post('/comments/:commentId/helpful', authenticateJwt, PostController.toggleHelpfulComment);
router.delete('/comments/:commentId', authenticateJwt, PostController.deleteComment);

export const postRoutes = router;
