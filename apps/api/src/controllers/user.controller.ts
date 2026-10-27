import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../common/response';
import { UserService } from '../services/user.service';
import {
  updateProfileSchema,
  updateEngineerProfileSchema,
} from '../validators/auth.validator';

export class UserController {
  public static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return sendError(res, 'NOT_FOUND', 'User not found.', 404);
      }

      return sendSuccess(res, UserService.toUserDto(user), 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to fetch user profile.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async getUserById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;
      if (!userId) {
        return sendError(res, 'BAD_REQUEST', 'User ID is required.', 400);
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return sendError(res, 'NOT_FOUND', 'User not found.', 404);
      }

      return sendSuccess(res, UserService.toUserDto(user), 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to fetch user profile.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);
      }

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid profile data provided.',
          400,
          parsed.error.errors
        );
      }

      await UserService.updateProfile(userId, parsed.data);
      const updatedUser = await UserService.findById(userId);
      if (!updatedUser) {
        return sendError(res, 'NOT_FOUND', 'User not found.', 404);
      }

      return sendSuccess(res, UserService.toUserDto(updatedUser), 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to update profile.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async updateEngineerProfile(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);
      }

      const parsed = updateEngineerProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid engineer profile data provided.',
          400,
          parsed.error.errors
        );
      }

      await UserService.updateEngineerProfile(userId, parsed.data);
      const updatedUser = await UserService.findById(userId);
      if (!updatedUser) {
        return sendError(res, 'NOT_FOUND', 'User not found.', 404);
      }

      return sendSuccess(res, UserService.toUserDto(updatedUser), 200);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NOT_AN_ENGINEER') {
        return sendError(
          res,
          'FORBIDDEN',
          'Only accounts with ENGINEER role can update engineer credentials.',
          403
        );
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to update engineer profile.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }
}
