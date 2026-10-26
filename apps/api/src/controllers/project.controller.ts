import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { sendSuccess, sendError } from '../common/response';
import { ProjectStage } from '@buildlink/shared';

export class ProjectController {
  public static async createProject(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const {
        title,
        description,
        location,
        district,
        stage,
        estimatedBudget,
        assignedEngineerId,
        startDate,
        targetCompletionDate,
      } = req.body;

      if (!title || !description || !location || !district) {
        sendError(res, 'VALIDATION_ERROR', 'title, description, location, and district are required', 400);
        return;
      }

      const project = await ProjectService.createProject(userId, {
        title,
        description,
        location,
        district,
        stage: stage || ProjectStage.PLANNING,
        estimatedBudget: Number(estimatedBudget) || 0,
        assignedEngineerId,
        startDate,
        targetCompletionDate,
      });

      sendSuccess(res, project, 201);
    } catch (err: any) {
      if (err.message === 'ENGINEER_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Assigned engineer not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async listMyProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const projects = await ProjectService.listUserProjects(userId);
      sendSuccess(res, projects, 200);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const project = await ProjectService.getProjectById(userId, id);
      if (!project) {
        sendError(res, 'NOT_FOUND', 'Project not found', 404);
        return;
      }

      sendSuccess(res, project, 200);
    } catch (err: any) {
      if (err.message === 'FORBIDDEN') {
        sendError(res, 'FORBIDDEN', 'You are not authorized to view this project', 403);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const updated = await ProjectService.updateProject(userId, id, req.body);
      sendSuccess(res, updated, 200);
    } catch (err: any) {
      if (err.message === 'PROJECT_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Project not found', 404);
        return;
      }
      if (err.message === 'FORBIDDEN') {
        sendError(res, 'FORBIDDEN', 'Only the project owner can update project settings', 403);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async addMilestone(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { stage, title, description, targetDate, photoUrls } = req.body;

      if (!stage || !title) {
        sendError(res, 'VALIDATION_ERROR', 'stage and title are required for a milestone', 400);
        return;
      }

      const milestone = await ProjectService.addMilestone(userId, id, {
        stage,
        title,
        description,
        targetDate,
        photoUrls,
      });

      sendSuccess(res, milestone, 201);
    } catch (err: any) {
      if (err.message === 'FORBIDDEN') {
        sendError(res, 'FORBIDDEN', 'Not authorized to add milestone', 403);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async updateMilestone(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { id, milestoneId } = req.params;
      const { isCompleted } = req.body;

      if (typeof isCompleted !== 'boolean') {
        sendError(res, 'VALIDATION_ERROR', 'isCompleted boolean flag is required', 400);
        return;
      }

      const milestone = await ProjectService.updateMilestone(userId, id, milestoneId, isCompleted);
      sendSuccess(res, milestone, 200);
    } catch (err: any) {
      if (err.message === 'MILESTONE_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Milestone not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async signOffMilestone(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { id, milestoneId } = req.params;
      const { notes, photoUrls } = req.body;

      const signedOff = await ProjectService.signOffMilestone(userId, id, milestoneId, {
        notes,
        photoUrls,
      });

      sendSuccess(res, signedOff, 200);
    } catch (err: any) {
      if (err.message === 'ONLY_ENGINEERS_CAN_SIGN_OFF') {
        sendError(res, 'FORBIDDEN', 'Only registered engineers can sign off on milestones', 403);
        return;
      }
      if (err.message === 'VERIFIED_ENGINEER_REQUIRED') {
        sendError(res, 'FORBIDDEN', 'Only verified engineers with active credential approval can certify milestones', 403);
        return;
      }
      if (err.message === 'MILESTONE_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Milestone not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }
}
