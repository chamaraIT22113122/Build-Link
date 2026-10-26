import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../common/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    sendError(
      res,
      'VALIDATION_ERROR',
      'One or more input fields failed validation.',
      422,
      err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
    return;
  }

  // 2. Syntax/JSON parse error
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    sendError(res, 'MALFORMED_JSON', 'Invalid JSON body supplied.', 400);
    return;
  }

  // 3. Catch-all Internal Server Error
  console.error('[Unhandled Error]', err);
  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal error occurred on the server.',
    500
  );
}
