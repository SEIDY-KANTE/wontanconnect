import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError, ERROR_CODES } from '../shared/errors.js';
import { sendError } from '../shared/response.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error({
    err,
    requestId: res.locals.requestId,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] || 'field';
      sendError(res, 'ALREADY_EXISTS', `A record with this ${field} already exists`, 409);
      return;
    }

    if (prismaError.code === 'P2025') {
      // Record not found
      sendError(res, 'RESOURCE_NOT_FOUND', 'Resource not found', 404);
      return;
    }
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 'VALIDATION_ERROR', 'Invalid JSON in request body', 400);
    return;
  }

  // Default to internal server error
  const message = env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred';

  sendError(res, ERROR_CODES.SERVER_ERROR, message, 500);
};

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 'RESOURCE_NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404);
}
