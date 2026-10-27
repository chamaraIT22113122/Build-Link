import { Request, Response } from 'express';
import { MessagingService } from '../services/messaging.service';
import { sendSuccess, sendError } from '../common/response';

export class MessagingController {
  public static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const senderId = (req as any).user?.id;
      if (!senderId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { recipientId, content, attachments } = req.body;
      if (!recipientId || typeof recipientId !== 'string') {
        sendError(res, 'VALIDATION_ERROR', 'Recipient ID is required', 400);
        return;
      }
      if (!content || typeof content !== 'string' || !content.trim()) {
        sendError(res, 'VALIDATION_ERROR', 'Message content is required', 400);
        return;
      }

      const msg = await MessagingService.sendMessage(
        senderId,
        recipientId,
        content.trim(),
        attachments
      );

      sendSuccess(res, msg, 201);
    } catch (err: any) {
      if (err.message === 'CANNOT_MESSAGE_SELF') {
        sendError(res, 'BAD_REQUEST', 'You cannot send a message to yourself', 400);
        return;
      }
      if (err.message === 'RECIPIENT_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Recipient user or engineer not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getThread(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { otherUserId } = req.params;
      const thread = await MessagingService.getThread(userId, otherUserId);
      sendSuccess(res, thread, 200);
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Target user not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversations = await MessagingService.getConversations(userId);
      sendSuccess(res, conversations, 200);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async connectUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { targetUserId } = req.params;
      const conn = await MessagingService.connectUser(userId, targetUserId);
      sendSuccess(res, conn, 201);
    } catch (err: any) {
      if (err.message === 'CANNOT_CONNECT_SELF') {
        sendError(res, 'BAD_REQUEST', 'You cannot connect with yourself', 400);
        return;
      }
      if (err.message === 'TARGET_USER_NOT_FOUND') {
        sendError(res, 'NOT_FOUND', 'Target user not found', 404);
        return;
      }
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async listConnections(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const list = await MessagingService.listConnections(userId);
      sendSuccess(res, list, 200);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        sendError(res, 'FILE_REQUIRED', 'Please select a file, image, or video to upload', 400);
        return;
      }

      const fileUrl = `/uploads/chat/${file.filename}`;
      sendSuccess(
        res,
        {
          url: fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
        201
      );
    } catch (err: any) {
      sendError(res, 'UPLOAD_ERROR', err.message || 'File upload failed', 500);
    }
  }
}

