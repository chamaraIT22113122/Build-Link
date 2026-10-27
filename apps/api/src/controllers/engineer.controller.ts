import { Request, Response } from 'express';
import { EngineerService } from '../services/engineer.service';
import { sendSuccess, sendError } from '../common/response';
import {
  ConsultationStatus,
  ConsultationType,
} from '@buildlink/shared';

export class EngineerController {
  public static async listEngineers(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        specialization,
        district,
        verifiedOnly,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const result = await EngineerService.listEngineers({
        search: typeof search === 'string' ? search : undefined,
        specialization: typeof specialization === 'string' ? specialization : undefined,
        district: typeof district === 'string' ? district : undefined,
        verifiedOnly: verifiedOnly === 'true',
        sortBy: (sortBy as any) || 'rating',
        sortOrder: (sortOrder as any) || 'DESC',
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      sendSuccess(res, result.data, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getEngineerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const engineer = await EngineerService.getEngineerById(id);

      if (!engineer) {
        sendError(res, 'ENGINEER_NOT_FOUND', 'Engineer profile not found', 404);
        return;
      }

      sendSuccess(res, engineer, 200);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async requestConsultation(req: Request, res: Response): Promise<void> {
    try {
      const clientId = (req as any).user?.id;
      if (!clientId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const {
        engineerId,
        consultationType,
        scheduledAt,
        problemDescription,
        attachments,
      } = req.body;

      if (!engineerId || !problemDescription) {
        sendError(res, 'VALIDATION_ERROR', 'engineerId and problemDescription are required', 400);
        return;
      }

      const consultation = await EngineerService.requestConsultation(clientId, {
        engineerId,
        consultationType: consultationType || ConsultationType.TEXT,
        scheduledAt,
        problemDescription,
        attachments,
      });

      sendSuccess(res, consultation, 201);
    } catch (err: any) {
      if (err.message === 'ENGINEER_NOT_FOUND') {
        sendError(res, 'ENGINEER_NOT_FOUND', 'Target engineer not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getMyConsultations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const items = await EngineerService.listUserConsultations(userId);
      sendSuccess(res, items, 200);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async updateConsultationStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(ConsultationStatus).includes(status)) {
        sendError(res, 'VALIDATION_ERROR', 'Valid consultation status is required', 400);
        return;
      }

      const updated = await EngineerService.updateConsultationStatus(userId, id, status);
      sendSuccess(res, updated, 200);
    } catch (err: any) {
      if (err.message === 'CONSULTATION_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Consultation request not found', 404);
        return;
      }
      if (err.message === 'FORBIDDEN') {
        sendError(res, 'FORBIDDEN', 'You are not authorized to update this consultation', 403);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async addConsultationMessage(req: Request, res: Response): Promise<void> {
    try {
      const senderId = (req as any).user?.id;
      if (!senderId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id: consultationId } = req.params;
      const { content, attachments } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        sendError(res, 'VALIDATION_ERROR', 'Message content is required', 400);
        return;
      }

      const message = await EngineerService.addConsultationMessage(
        senderId,
        consultationId,
        content.trim(),
        attachments
      );

      sendSuccess(res, message, 201);
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        sendError(res, 'USER_NOT_FOUND', 'Sender not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getConsultationMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id: consultationId } = req.params;
      const messages = await EngineerService.listConsultationMessages(userId, consultationId);
      sendSuccess(res, messages, 200);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async addEngineerReview(req: Request, res: Response): Promise<void> {
    try {
      const clientId = (req as any).user?.id;
      if (!clientId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id: engineerProfileId } = req.params;
      const { rating, reviewText, consultationId } = req.body;

      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        sendError(res, 'VALIDATION_ERROR', 'Rating must be an integer between 1 and 5', 400);
        return;
      }

      if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 5) {
        sendError(res, 'VALIDATION_ERROR', 'Review text must be at least 5 characters', 400);
        return;
      }

      const review = await EngineerService.addEngineerReview(
        clientId,
        engineerProfileId,
        Math.round(rating),
        reviewText.trim(),
        consultationId
      );

      sendSuccess(res, review, 201);
    } catch (err: any) {
      if (err.message === 'ENGINEER_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Engineer profile not found', 404);
        return;
      }
      if (err.message === 'INVALID_RATING') {
        sendError(res, 'VALIDATION_ERROR', 'Rating must be between 1 and 5', 400);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getEngineerReviews(req: Request, res: Response): Promise<void> {
    try {
      const { id: engineerProfileId } = req.params;
      const reviews = await EngineerService.listEngineerReviews(engineerProfileId);
      sendSuccess(res, reviews, 200);
    } catch (err: any) {
      if (err.message === 'ENGINEER_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Engineer profile not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }
}

