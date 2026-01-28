import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination.js';

// Create notification (internal use)
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'session_request',
    'session_accepted',
    'session_declined',
    'session_cancelled',
    'session_confirmed',
    'session_completed',
    'new_message',
    'rating_received',
    'offer_expired',
    'system',
  ]),
  title: z.string().min(1).max(200),
  body: z.string().max(500),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['push', 'in_app', 'email'])).default(['in_app']),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// Register push token
export const registerPushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().optional(),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

// Notification filters
export const notificationFiltersSchema = paginationSchema.extend({
  unreadOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  type: z.string().optional(),
});

export type NotificationFiltersInput = z.infer<typeof notificationFiltersSchema>;

// Params
export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});
