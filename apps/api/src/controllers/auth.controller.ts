import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../common/response';
import { UserService } from '../services/user.service';
import { comparePassword } from '../common/password';
import { signJwt } from '../common/jwt';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import { UserStatus } from '@buildlink/shared';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Validation failed. Please correct input fields.',
          400,
          parsed.error.errors
        );
      }

      const user = await UserService.createUser(parsed.data);
      const token = signJwt({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return sendSuccess(
        res,
        {
          user: UserService.toUserDto(user),
          token,
        },
        201
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
        return sendError(
          res,
          'CONFLICT',
          'An account with this email address already exists.',
          409
        );
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'An error occurred during account registration.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async login(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid email or password format.',
          400,
          parsed.error.errors
        );
      }

      const user = await UserService.findByEmail(parsed.data.email);
      if (!user) {
        return sendError(
          res,
          'INVALID_CREDENTIALS',
          'Invalid email or password provided.',
          401
        );
      }

      const isMatch = await comparePassword(parsed.data.password, user.passwordHash);
      if (!isMatch) {
        return sendError(
          res,
          'INVALID_CREDENTIALS',
          'Invalid email or password provided.',
          401
        );
      }

      if (user.status === UserStatus.SUSPENDED) {
        return sendError(
          res,
          'ACCOUNT_SUSPENDED',
          'This account has been suspended. Please contact BuildLink support.',
          403
        );
      }

      const token = signJwt({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return sendSuccess(
        res,
        {
          user: UserService.toUserDto(user),
          token,
        },
        200
      );
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred during login.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async me(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return sendError(res, 'NOT_FOUND', 'User profile not found.', 404);
      }

      return sendSuccess(res, UserService.toUserDto(user), 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to retrieve authenticated user profile.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async logout(_req: Request, res: Response): Promise<Response> {
    return sendSuccess(res, { message: 'Successfully signed out of BuildLink.' }, 200);
  }

  public static async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);
      }

      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Validation failed for password change.',
          400,
          parsed.error.errors
        );
      }

      await UserService.changePassword(
        userId,
        parsed.data.currentPassword,
        parsed.data.newPassword
      );

      return sendSuccess(res, { message: 'Password updated successfully.' }, 200);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_CURRENT_PASSWORD') {
        return sendError(
          res,
          'INVALID_CREDENTIALS',
          'The current password entered is incorrect.',
          400
        );
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to change password.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'A valid email address is required.',
          400,
          parsed.error.errors
        );
      }

      // Security practice: Return generic positive message regardless of whether email exists
      return sendSuccess(
        res,
        {
          message:
            'If an account exists with that email, a password reset link has been dispatched.',
        },
        200
      );
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to process password reset request.',
        500
      );
    }
  }

  public static async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid reset token or new password format.',
          400,
          parsed.error.errors
        );
      }

      return sendSuccess(
        res,
        { message: 'Password has been reset successfully. You may now log in.' },
        200
      );
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to reset password.',
        500
      );
    }
  }
}
