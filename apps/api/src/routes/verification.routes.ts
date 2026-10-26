import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticateJwt, requireRoles } from '../middleware/auth.middleware';
import { uploadVerificationDocs } from '../middleware/upload.middleware';
import { UserRole } from '@buildlink/shared';

const router = Router();

// Upload supporting credential file (PDF/Image)
router.post(
  '/upload',
  authenticateJwt,
  uploadVerificationDocs.single('document'),
  VerificationController.uploadDocument
);

// Engineer Application & Status Endpoints
router.post(
  '/apply',
  authenticateJwt,
  requireRoles(UserRole.ENGINEER),
  VerificationController.apply
);

router.get(
  '/status',
  authenticateJwt,
  requireRoles(UserRole.ENGINEER),
  VerificationController.getMyStatus
);

// Administration & Audit Endpoints
router.get(
  '/admin/applications',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  VerificationController.listApplications
);

router.put(
  '/admin/applications/:id/review',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  VerificationController.reviewApplication
);

router.get(
  '/admin/audit-logs',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  VerificationController.getAuditLogs
);

export const verificationRoutes = router;
