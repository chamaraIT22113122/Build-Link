import { Router } from 'express';
import { EngineerController } from '../controllers/engineer.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// Public Directory Endpoints
router.get('/', EngineerController.listEngineers);

// Consultations (Authenticated)
router.post('/consultations', authenticateJwt, EngineerController.requestConsultation);
router.get('/consultations/my', authenticateJwt, EngineerController.getMyConsultations);
router.put('/consultations/:id/status', authenticateJwt, EngineerController.updateConsultationStatus);
router.get('/consultations/:id/messages', authenticateJwt, EngineerController.getConsultationMessages);
router.post('/consultations/:id/messages', authenticateJwt, EngineerController.addConsultationMessage);

// Engineer Reviews & Ratings
router.get('/:id/reviews', EngineerController.getEngineerReviews);
router.post('/:id/reviews', authenticateJwt, EngineerController.addEngineerReview);

// Specific Engineer Details (Public)
router.get('/:id', EngineerController.getEngineerById);

export const engineerRoutes = router;

