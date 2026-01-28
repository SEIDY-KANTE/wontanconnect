/**
 * Notifications API (Production-Ready)
 *
 * Complete notifications module with proper adapters, NO mock fallbacks.
 *
 * CRITICAL CHANGES:
 * - Uses adaptBackendNotification for 'read' → 'isRead' mapping
 * - Unread count from separate endpoint (NOT in pagination meta)
 * - Proper error propagation
 * - Push token registration support
 */

import { apiClient } from "./client";
import { handleApiError } from "./errorHandling";
import {
  adaptBackendPagination,
  type MobilePaginationMeta,
} from "./contracts/pagination";
import {
  adaptBackendNotification,
  adaptBackendNotifications,
  adaptUnreadCountResponse,
  type MobileNotification,
  type NotificationType,
  type RegisterPushTokenRequest,
} from "./contracts/notifications.adapter";
import { debugLog, errorLog } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface NotificationsListResponse {
  notifications: MobileNotification[];
  meta: MobilePaginationMeta;
  unreadCount: number; // Fetched separately and merged
}

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

/**
 * List notifications for the current user
 *
 * NOTE: Also fetches unread count from separate endpoint
 * and merges into response for mobile convenience.
 */
export async function listNotifications(
  filters?: NotificationFilters,
): Promise<NotificationsListResponse> {
  debugLog("NotificationsAPI", "Listing notifications", filters);

  try {
    // Fetch notifications and unread count in parallel
    const [notificationsResponse, unreadCount] = await Promise.all([
      apiClient.get("/notifications", {
        params: {
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          unreadOnly: filters?.unreadOnly ? "true" : undefined,
          type: filters?.type,
        },
      }),
      getUnreadCount(),
    ]);

    const notifications = adaptBackendNotifications(
      notificationsResponse.data.data,
    );
    const meta = adaptBackendPagination(notificationsResponse.data.pagination);

    debugLog(
      "NotificationsAPI",
      `Loaded ${notifications.length} notifications, ${unreadCount} unread`,
    );

    return {
      notifications,
      meta,
      unreadCount,
    };
  } catch (error) {
    errorLog("NotificationsAPI", error, "listNotifications");
    throw handleApiError(error);
  }
}

/**
 * Get only unread notifications (convenience wrapper)
 */
export async function getUnreadNotifications(
  limit = 10,
): Promise<NotificationsListResponse> {
  return listNotifications({ unreadOnly: true, limit });
}

/**
 * Get unread notification count
 *
 * CRITICAL: Backend returns this from separate endpoint,
 * NOT in pagination meta as mobile previously expected.
 */
export async function getUnreadCount(): Promise<number> {
  debugLog("NotificationsAPI", "Getting unread count");

  try {
    const response = await apiClient.get("/notifications/unread-count");

    const count = adaptUnreadCountResponse(response.data.data);

    debugLog("NotificationsAPI", `Unread count: ${count}`);

    return count;
  } catch (error) {
    errorLog("NotificationsAPI", error, "getUnreadCount");
    throw handleApiError(error);
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  notificationId: string,
): Promise<MobileNotification> {
  debugLog("NotificationsAPI", "Marking notification as read", notificationId);

  try {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`,
    );

    const notification = adaptBackendNotification(response.data.data);

    debugLog("NotificationsAPI", "Notification marked as read");

    return notification;
  } catch (error) {
    errorLog("NotificationsAPI", error, `markAsRead(${notificationId})`);
    throw handleApiError(error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  debugLog("NotificationsAPI", "Marking all notifications as read");

  try {
    const response = await apiClient.post("/notifications/mark-all-read");

    const count = response.data.data?.count || 0;

    debugLog("NotificationsAPI", `Marked ${count} notifications as read`);

    return { count };
  } catch (error) {
    errorLog("NotificationsAPI", error, "markAllAsRead");
    throw handleApiError(error);
  }
}

// ============================================================================
// PUSH TOKEN MANAGEMENT
// ============================================================================

/**
 * Register a push notification token
 */
export async function registerPushToken(
  request: RegisterPushTokenRequest,
): Promise<{ id: string; platform: string }> {
  debugLog("NotificationsAPI", "Registering push token", {
    platform: request.platform,
  });

  try {
    const response = await apiClient.post("/notifications/push-token", request);

    debugLog("NotificationsAPI", "Push token registered");

    return response.data.data;
  } catch (error) {
    errorLog("NotificationsAPI", error, "registerPushToken");
    throw handleApiError(error);
  }
}

/**
 * Unregister a push notification token
 */
export async function unregisterPushToken(token: string): Promise<void> {
  debugLog("NotificationsAPI", "Unregistering push token");

  try {
    await apiClient.delete("/notifications/push-token", {
      data: { token },
    });

    debugLog("NotificationsAPI", "Push token unregistered");
  } catch (error) {
    errorLog("NotificationsAPI", error, "unregisterPushToken");
    throw handleApiError(error);
  }
}

// ============================================================================
// NOTIFICATION STORE HELPERS
// ============================================================================

/**
 * Prepend a new notification to a list (for real-time updates)
 */
export function prependNotification(
  notifications: MobileNotification[],
  newNotification: MobileNotification,
): MobileNotification[] {
  // Check for duplicates
  if (notifications.some((n) => n.id === newNotification.id)) {
    return notifications;
  }
  return [newNotification, ...notifications];
}

/**
 * Update notification read status in a list
 */
export function updateNotificationReadStatus(
  notifications: MobileNotification[],
  notificationId: string,
  isRead: boolean,
): MobileNotification[] {
  return notifications.map((n) =>
    n.id === notificationId
      ? { ...n, isRead, readAt: isRead ? new Date() : undefined }
      : n,
  );
}

/**
 * Mark all notifications as read in a list
 */
export function markAllNotificationsAsRead(
  notifications: MobileNotification[],
): MobileNotification[] {
  const now = new Date();
  return notifications.map((n) =>
    n.isRead ? n : { ...n, isRead: true, readAt: now },
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  MobileNotification,
  NotificationType,
  RegisterPushTokenRequest,
} from "./contracts/notifications.adapter";

export {
  getNotificationAction,
  groupNotificationsByDate,
  requiresAttention,
} from "./contracts/notifications.adapter";
