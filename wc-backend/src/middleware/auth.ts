import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { env } from '../config/env.js';
import { Errors, AppError } from '../shared/errors.js';
import { sendError } from '../shared/response.js';
import type { AuthContext, AccessTokenPayload } from '../shared/types.js';

// Create secret key for JWT
const secret = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Verify an access token and return the payload.
 * Used by WebSocket server for connection authentication.
 */
export async function verifyAccessToken(
  token: string
): Promise<{ userId: string; role: string; isGuest: boolean } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const tokenPayload = payload as unknown as AccessTokenPayload;

    return {
      userId: tokenPayload.sub,
      role: tokenPayload.role,
      isGuest: tokenPayload.isGuest,
    };
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Errors.tokenInvalid();
    }

    const token = authHeader.substring(7);

    try {
      const { payload } = await jose.jwtVerify(token, secret, {
        algorithms: ['HS256'],
      });

      const tokenPayload = payload as unknown as AccessTokenPayload;

      req.auth = {
        userId: tokenPayload.sub,
        role: tokenPayload.role,
        isGuest: tokenPayload.isGuest,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jose.errors.JWTExpired) {
        throw Errors.tokenExpired();
      }
      throw Errors.tokenInvalid();
    }
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.code, error.message, error.statusCode);
      return;
    }
    next(error);
  }
}

// Optional auth - doesn't fail if no token, just doesn't set auth context
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const tokenPayload = payload as unknown as AccessTokenPayload;

    req.auth = {
      userId: tokenPayload.sub,
      role: tokenPayload.role,
      isGuest: tokenPayload.isGuest,
    };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
}

// Require non-guest user
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    sendError(res, 'AUTH_TOKEN_INVALID', 'Authentication required', 401);
    return;
  }

  if (req.auth.isGuest) {
    sendError(res, 'AUTH_GUEST_RESTRICTED', 'This feature requires a registered account', 403);
    return;
  }

  next();
}

// Require specific roles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      sendError(res, 'AUTH_TOKEN_INVALID', 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.auth.role)) {
      sendError(res, 'AUTH_UNAUTHORIZED', 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}
