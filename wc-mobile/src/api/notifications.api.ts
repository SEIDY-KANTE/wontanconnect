/**
 * Notifications API
 *
 * API endpoints for notifications management.
 */

import { apiClient } from "./client";
import { NOTIFICATIONS_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Notification, PaginationParams } from "./types";

// ============================================================================
// NOTIFICATIONS API FUNCTIONS
// ============================================================================

/**
 * List notifications for the current user.
 */
export async function listNotifications(params?: PaginationParams): Promise<{
  notifications: Notification[];
  total: number;
  unreadCount: number;
}> {
  try {
    console.log("[NotificationsAPI] Listing notifications");

    const response = await apiClient.get<
      ApiResponse<Notification[]> & {
        meta: { total: number; unreadCount: number };
      }
    >(NOTIFICATIONS_ENDPOINTS.LIST, { params });

    const { data, meta } = response.data;

    console.log("[NotificationsAPI] Fetched", data.length, "notifications");
    return {
      notifications: data,
      total: meta.total,
      unreadCount: meta.unreadCount || 0,
    };
  } catch (error) {
    console.error("[NotificationsAPI] Failed to list notifications:", error);
    throw error;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  try {
    console.log("[NotificationsAPI] Marking notification as read:", id);

    await apiClient.patch(NOTIFICATIONS_ENDPOINTS.MARK_READ(id));

    console.log("[NotificationsAPI] Notification marked as read");
  } catch (error) {
    console.error(
      "[NotificationsAPI] Failed to mark notification as read:",
      error,
    );
    throw error;
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    console.log("[NotificationsAPI] Marking all notifications as read");

    await apiClient.patch(NOTIFICATIONS_ENDPOINTS.MARK_ALL_READ);

    console.log("[NotificationsAPI] All notifications marked as read");
  } catch (error) {
    console.error(
      "[NotificationsAPI] Failed to mark all notifications as read:",
      error,
    );
    throw error;
  }
}

/**
 * Register device for push notifications.
 */
export async function registerDevice(
  token: string,
  platform: "ios" | "android" | "web" = "android",
  deviceId?: string,
): Promise<void> {
  try {
    console.log("[NotificationsAPI] Registering device for push notifications");

    await apiClient.post(NOTIFICATIONS_ENDPOINTS.REGISTER_DEVICE, {
      token,
      platform,
      deviceId,
    });

    console.log("[NotificationsAPI] Device registered");
  } catch (error) {
    console.error("[NotificationsAPI] Failed to register device:", error);
    throw error;
  }
}
