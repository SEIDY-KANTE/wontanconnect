/**
 * Notifications Contracts
 *
 * Notification types and adapters.
 * Note: Mobile expects unreadCount in meta, backend may have separate endpoint.
 */

import { z } from "zod";
import { BackendPaginationSchema } from "./pagination";

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NotificationTypeSchema = z.enum([
  "session_request",
  "session_accepted",
  "session_declined",
  "session_completed",
  "session_cancelled",
  "message_received",
  "rating_received",
  "system",
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// ============================================================================
// BACKEND SCHEMAS
// ============================================================================

/**
 * Backend notification format
 */
export const BackendNotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable().optional(),
  isRead: z.boolean(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type BackendNotification = z.infer<typeof BackendNotificationSchema>;

/**
 * Backend notifications list response
 * Note: unreadCount may be in a separate field or need a separate API call
 */
export const BackendNotificationsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(BackendNotificationSchema),
  pagination: BackendPaginationSchema.optional(),
  // Backend may include unreadCount in meta or pagination
  unreadCount: z.number().optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    unreadCount: z.number().optional(), // May be here instead
  }),
});

export type BackendNotificationsListResponse = z.infer<
  typeof BackendNotificationsListResponseSchema
>;

// ============================================================================
// MOBILE MODELS
// ============================================================================

/**
 * Mobile notification model
 */
export interface MobileNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Notification icon mapping based on type
 */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  session_request: "swap-horizontal",
  session_accepted: "checkmark-circle",
  session_declined: "close-circle",
  session_completed: "trophy",
  session_cancelled: "close-circle-outline",
  message_received: "chatbubble",
  rating_received: "star",
  system: "information-circle",
};

/**
 * Notification colors based on type
 */
export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  session_request: "#2196F3",
  session_accepted: "#4CAF50",
  session_declined: "#F44336",
  session_completed: "#4CAF50",
  session_cancelled: "#9E9E9E",
  message_received: "#2196F3",
  rating_received: "#FFC107",
  system: "#9E9E9E",
};

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Adapts backend notification to mobile format
 */
export function adaptNotification(
  notification: BackendNotification,
): MobileNotification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data ?? null,
    isRead: notification.isRead,
    readAt: notification.readAt ? new Date(notification.readAt) : null,
    createdAt: new Date(notification.createdAt),
  };
}

/**
 * Validates and adapts raw notification response
 */
export function validateAndAdaptNotification(raw: unknown): MobileNotification {
  const validated = BackendNotificationSchema.parse(raw);
  return adaptNotification(validated);
}

/**
 * Validates and adapts raw notifications list response
 * Handles the unreadCount from wherever the backend provides it
 */
export function validateAndAdaptNotificationsList(raw: unknown): {
  notifications: MobileNotification[];
  pagination: z.infer<typeof BackendPaginationSchema> | undefined;
  unreadCount: number;
} {
  const validated = BackendNotificationsListResponseSchema.parse(raw);

  // Try to get unreadCount from multiple possible locations
  const unreadCount =
    validated.unreadCount ??
    validated.meta?.unreadCount ??
    validated.data.filter((n) => !n.isRead).length;

  return {
    notifications: validated.data.map(adaptNotification),
    pagination: validated.pagination,
    unreadCount,
  };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Register device for push notifications
 */
export interface RegisterDeviceRequest {
  token: string;
  platform: "ios" | "android" | "web";
  deviceId?: string;
}
