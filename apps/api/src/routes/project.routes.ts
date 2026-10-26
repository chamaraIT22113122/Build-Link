import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// All project operations require authentication
router.use(authenticateJwt);

// Projects CRUD
router.post('/', ProjectController.createProject);
router.get('/', ProjectController.listMyProjects);
router.get('/:id', ProjectController.getProjectById);
router.put('/:id', ProjectController.updateProject);

// Milestones & Engineer Certification
router.post('/:id/milestones', ProjectController.addMilestone);
router.put('/:id/milestones/:milestoneId', ProjectController.updateMilestone);
router.put('/:id/milestones/:milestoneId/sign-off', ProjectController.signOffMilestone);

export const projectRoutes = router;
