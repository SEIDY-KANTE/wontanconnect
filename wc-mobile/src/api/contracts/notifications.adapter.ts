/**
 * Notifications Module Adapters
 *
 * Bidirectional adapters for notifications between mobile and backend.
 *
 * BACKEND FORMAT (from controller.ts):
 * - Notification: { id, type, title, body, data, channels, read, readAt, createdAt }
 * - Unread count: { unreadCount: number }
 *
 * MOBILE EXPECTED FORMAT:
 * - Notification: { id, type, title, body, data, isRead, createdAt }
 *
 * CRITICAL MISMATCH:
 * - Backend uses 'read' (boolean), mobile expects 'isRead'
 * - Unread count is separate endpoint, NOT in pagination meta
 */

import { z } from "zod";

// ============================================================================
// BACKEND SCHEMAS (What the backend actually returns)
// ============================================================================

/**
 * Notification types from backend
 */
export const NotificationTypeSchema = z.enum([
  "session_request",
  "session_accepted",
  "session_declined",
  "session_cancelled",
  "session_confirmed",
  "session_completed",
  "new_message",
  "rating_received",
  "offer_expired",
  "system",
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

/**
 * Notification channels
 */
export const NotificationChannelSchema = z.enum(["push", "in_app", "email"]);

/**
 * Backend notification format from controller.formatNotification()
 */
export const BackendNotificationSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable().optional(),
  channels: z.array(NotificationChannelSchema).optional(),
  read: z.boolean(), // Backend uses 'read', NOT 'isRead'
  readAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type BackendNotification = z.infer<typeof BackendNotificationSchema>;

/**
 * Backend unread count response
 */
export const BackendUnreadCountResponseSchema = z.object({
  unreadCount: z.number(),
});

/**
 * Backend mark all as read response
 */
export const BackendMarkAllReadResponseSchema = z.object({
  count: z.number().optional(),
  message: z.string().optional(),
});

// ============================================================================
// MOBILE TYPES (What the mobile app expects)
// ============================================================================

export interface MobileNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: Array<"push" | "in_app" | "email">;
  isRead: boolean; // Mobile expects 'isRead'
  readAt?: Date;
  createdAt: Date;
}

/**
 * Notification action based on type
 */
export interface NotificationAction {
  type: "navigate" | "dismiss" | "none";
  screen?: string;
  params?: Record<string, unknown>;
}

// ============================================================================
// ADAPTERS: Backend → Mobile
// ============================================================================

/**
 * Adapt backend notification to mobile format
 *
 * CRITICAL: Maps 'read' → 'isRead'
 */
export function adaptBackendNotification(raw: unknown): MobileNotification {
  const validated = BackendNotificationSchema.parse(raw);

  return {
    id: validated.id,
    type: validated.type,
    title: validated.title,
    body: validated.body,
    data: validated.data ?? undefined,
    channels: validated.channels,
    isRead: validated.read, // KEY MAPPING: read → isRead
    readAt: validated.readAt ? new Date(validated.readAt) : undefined,
    createdAt: new Date(validated.createdAt),
  };
}

/**
 * Adapt array of backend notifications
 */
export function adaptBackendNotifications(
  raw: unknown[],
): MobileNotification[] {
  return raw.map(adaptBackendNotification);
}

/**
 * Adapt unread count response
 */
export function adaptUnreadCountResponse(raw: unknown): number {
  const validated = BackendUnreadCountResponseSchema.parse(raw);
  return validated.unreadCount;
}

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================

/**
 * Determine navigation action based on notification type and data
 */
export function getNotificationAction(
  notification: MobileNotification,
): NotificationAction {
  const { type, data } = notification;

  switch (type) {
    case "session_request":
    case "session_accepted":
    case "session_declined":
    case "session_cancelled":
    case "session_confirmed":
    case "session_completed":
      return {
        type: "navigate",
        screen: "SessionDetails",
        params: { sessionId: data?.sessionId },
      };

    case "new_message":
      return {
        type: "navigate",
        screen: "Conversation",
        params: { conversationId: data?.conversationId },
      };

    case "rating_received":
      return {
        type: "navigate",
        screen: "Ratings",
        params: { ratingId: data?.ratingId },
      };

    case "offer_expired":
      return {
        type: "navigate",
        screen: "MyOffers",
        params: { offerId: data?.offerId },
      };

    case "system":
    default:
      return { type: "dismiss" };
  }
}

/**
 * Group notifications by date for section list display
 */
export function groupNotificationsByDate(
  notifications: MobileNotification[],
): Array<{ title: string; data: MobileNotification[] }> {
  const groups: Record<string, MobileNotification[]> = {};

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const notification of notifications) {
    const date = notification.createdAt;
    let groupKey: string;

    if (date >= today) {
      groupKey = "Today";
    } else if (date >= yesterday) {
      groupKey = "Yesterday";
    } else if (date >= weekAgo) {
      groupKey = "This Week";
    } else {
      groupKey = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  }

  // Convert to array in order
  const orderedKeys = ["Today", "Yesterday", "This Week"];
  const result: Array<{ title: string; data: MobileNotification[] }> = [];

  for (const key of orderedKeys) {
    if (groups[key]) {
      result.push({ title: key, data: groups[key] });
      delete groups[key];
    }
  }

  // Add remaining months
  for (const [key, data] of Object.entries(groups)) {
    result.push({ title: key, data });
  }

  return result;
}

// ============================================================================
// PUSH TOKEN TYPES
// ============================================================================

export interface RegisterPushTokenRequest {
  token: string;
  platform: "ios" | "android" | "web";
  deviceId?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a notification response
 */
export function validateNotification(
  data: unknown,
): BackendNotification | null {
  try {
    return BackendNotificationSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Check if notification requires attention (unread + actionable)
 */
export function requiresAttention(notification: MobileNotification): boolean {
  if (notification.isRead) return false;

  const actionable: NotificationType[] = [
    "session_request",
    "new_message",
    "rating_received",
  ];

  return actionable.includes(notification.type);
}
