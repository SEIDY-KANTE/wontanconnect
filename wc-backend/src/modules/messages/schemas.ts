import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination.js';

// Create message
export const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['text', 'image', 'location', 'system']).default('text'),
  metadata: z.record(z.any()).optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

// Message filters
export const messageFiltersSchema = paginationSchema.extend({
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional(),
});

export type MessageFiltersInput = z.infer<typeof messageFiltersSchema>;

// Conversation filters
export const conversationFiltersSchema = paginationSchema.extend({
  unreadOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export type ConversationFiltersInput = z.infer<typeof conversationFiltersSchema>;

// Params
export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const messageIdParamSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string().uuid(),
});
