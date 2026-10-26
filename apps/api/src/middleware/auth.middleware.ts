import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../common/jwt';
import { sendError } from '../common/response';
import { UserRole } from '@buildlink/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Missing or invalid Bearer authentication token.', 401);
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    sendError(res, 'UNAUTHORIZED', 'Bearer token cannot be empty.', 401);
    return;
  }

  const decoded = verifyJwt(token);
  if (!decoded) {
    sendError(res, 'UNAUTHORIZED', 'Token is expired or invalid. Please log in again.', 401);
    return;
  }

  req.user = {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };

  next();
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication is required for this action.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        'FORBIDDEN',
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
}
