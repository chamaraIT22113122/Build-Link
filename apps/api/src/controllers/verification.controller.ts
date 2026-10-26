import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../common/response';
import { VerificationService } from '../services/verification.service';
import {
  applyVerificationSchema,
  reviewVerificationSchema,
} from '../validators/verification.validator';
import { VerificationStatus } from '@buildlink/shared';

export class VerificationController {
  public static async uploadDocument(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return sendError(res, 'NO_FILE_UPLOADED', 'Please select a document or image to upload.', 400);
      }

      const fileUrl = `/uploads/verification/${req.file.filename}`;
      return sendSuccess(
        res,
        {
          fileUrl,
          originalFilename: req.file.originalname,
          fileSizeBytes: req.file.size,
          mimeType: req.file.mimetype,
        },
        201
      );
    } catch (err: unknown) {
      return sendError(
        res,
        'UPLOAD_FAILED',
        'Failed to process file upload.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async apply(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email || 'engineer@buildlink.lk';
      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);
      }

      const parsed = applyVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Validation failed for verification application.',
          400,
          parsed.error.errors
        );
      }

      const app = await VerificationService.applyForVerification(
        userId,
        userEmail,
        parsed.data,
        req.ip
      );

      return sendSuccess(res, app, 201);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'ONLY_ENGINEERS_CAN_APPLY') {
        return sendError(
          res,
          'FORBIDDEN',
          'Only accounts with ENGINEER role can submit verification credentials.',
          403
        );
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to submit verification application.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async getMyStatus(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);
      }

      const app = await VerificationService.getMyVerificationStatus(userId);
      return sendSuccess(res, app, 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to fetch verification application status.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async listApplications(req: Request, res: Response): Promise<Response> {
    try {
      const statusParam = req.query.status as VerificationStatus | undefined;
      const applications = await VerificationService.listApplications(statusParam);
      return sendSuccess(res, applications, 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to retrieve verification applications.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async reviewApplication(req: Request, res: Response): Promise<Response> {
    try {
      const applicationId = req.params.id;
      const adminUserId = req.user?.id || 'admin';
      const adminEmail = req.user?.email || 'admin@buildlink.lk';

      const parsed = reviewVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid review parameters provided.',
          400,
          parsed.error.errors
        );
      }

      const updated = await VerificationService.reviewApplication(
        applicationId,
        adminUserId,
        adminEmail,
        parsed.data,
        req.ip
      );

      return sendSuccess(res, updated, 200);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'APPLICATION_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', 'Verification application not found.', 404);
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to review verification application.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async getAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
      const limit = Number(req.query.limit || 50);
      const logs = await VerificationService.getAuditLogs(limit);
      return sendSuccess(res, logs, 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to retrieve audit logs.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }
}
