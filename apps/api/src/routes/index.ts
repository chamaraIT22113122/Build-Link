import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { docsRoutes } from '../docs/swagger';

const router = Router();

// Health Check
router.use('/', healthRoutes);

// Authentication & Identity
router.use('/auth', authRoutes);

// Users & Profile Management
router.use('/users', userRoutes);

// OpenAPI Documentation
router.use('/', docsRoutes);

export const apiRouter = router;

