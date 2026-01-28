import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination.js';

// Create session
export const createSessionSchema = z.object({
  offerId: z.string().uuid(),
  proposedAmount: z.number().positive().optional(),
  message: z.string().max(500).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// Accept session (for offer owner)
export const acceptSessionSchema = z.object({
  acceptedAmount: z.number().positive().optional(),
});

export type AcceptSessionInput = z.infer<typeof acceptSessionSchema>;

// Decline session
export const declineSessionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type DeclineSessionInput = z.infer<typeof declineSessionSchema>;

// Cancel session
export const cancelSessionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;

// Confirm session (mutual confirmation)
export const confirmSessionSchema = z.object({
  // Matches Prisma ConfirmationType enum: 'sent' | 'received'
  confirmationType: z.enum(['sent', 'received']),
  notes: z.string().max(500).optional(),
});

export type ConfirmSessionInput = z.infer<typeof confirmSessionSchema>;

// Session filters
export const sessionFiltersSchema = paginationSchema.extend({
  status: z
    .enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'])
    .optional(),
  role: z.enum(['initiator', 'responder', 'all']).optional().default('all'),
});

export type SessionFiltersInput = z.infer<typeof sessionFiltersSchema>;

// Params
export const sessionIdParamSchema = z.object({
  id: z.string().uuid(),
});
