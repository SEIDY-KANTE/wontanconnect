import { Request, Response, NextFunction } from 'express';
import { createRequestId } from '../shared/response.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || createRequestId();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
