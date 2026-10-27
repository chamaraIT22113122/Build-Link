import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { verificationRoutes } from './verification.routes';
import { postRoutes } from './post.routes';
import { engineerRoutes } from './engineer.routes';
import { projectRoutes } from './project.routes';
import { knowledgeRoutes } from './knowledge.routes';
import { messagingRoutes } from './messaging.routes';
import { docsRoutes } from '../docs/swagger';

const router = Router();

// Health Check
router.use('/', healthRoutes);

// Authentication & Identity
router.use('/auth', authRoutes);

// Users & Profile Management
router.use('/users', userRoutes);

// Professional Credential Verification & Audit
router.use('/verification', verificationRoutes);

// Social Community Feed & Q&A Posts
router.use('/posts', postRoutes);

// Professional Directory & Matching
router.use('/engineers', engineerRoutes);

// Direct Private Messaging & Messenger (Facebook-style)
router.use('/messages', messagingRoutes);

// Project Tracking & Construction Milestones
router.use('/projects', projectRoutes);

// Knowledge Hub & Sri Lankan Building Standards
router.use('/knowledge', knowledgeRoutes);

// OpenAPI Documentation
router.use('/', docsRoutes);

export const apiRouter = router;




