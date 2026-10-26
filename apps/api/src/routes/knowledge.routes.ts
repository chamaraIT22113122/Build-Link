import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledge.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// Public Technical Catalog & Standards Endpoints
router.get('/', KnowledgeController.listArticles);
router.get('/:slug', KnowledgeController.getArticleBySlug);

// Technical Guide Authoring (Authenticated)
router.post('/', authenticateJwt, KnowledgeController.createArticle);

export const knowledgeRoutes = router;
