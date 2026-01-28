import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination.js';

// Submit rating
export const createRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

// Rating filters
export const ratingFiltersSchema = paginationSchema.extend({
  minScore: z.string().transform(Number).pipe(z.number().min(1).max(5)).optional(),
  maxScore: z.string().transform(Number).pipe(z.number().min(1).max(5)).optional(),
});

export type RatingFiltersInput = z.infer<typeof ratingFiltersSchema>;

// Params
export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});
