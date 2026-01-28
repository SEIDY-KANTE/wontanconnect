import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { Errors } from '../shared/errors.js';
import { sendError } from '../shared/response.js';

type ValidateTarget = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);
        return;
      }
      next(error);
    }
  };
}

// Single target validation helper
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}
