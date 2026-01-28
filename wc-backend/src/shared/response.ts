import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PaginationMeta } from './pagination.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: PaginationMeta;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export function createRequestId(): string {
  return `req_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || createRequestId(),
    },
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || createRequestId(),
    },
  };

  res.status(statusCode).json(response);
}
