import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJwt, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@buildlink/shared';

const router = Router();

router.get('/profile', authenticateJwt, UserController.getProfile);
router.put('/profile', authenticateJwt, UserController.updateProfile);
router.put(
  '/engineer-profile',
  authenticateJwt,
  requireRoles(UserRole.ENGINEER),
  UserController.updateEngineerProfile
);

export const userRoutes = router;
