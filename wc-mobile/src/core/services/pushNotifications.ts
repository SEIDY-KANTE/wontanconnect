/**
 * Push Notifications Service
 *
 * Handles push notification setup, permissions, and token registration.
 * Uses expo-notifications for cross-platform push notification support.
 *
 * Setup:
 * 1. ✅ Installed: expo-notifications, expo-device, expo-constants
 * 2. Configure app.json with notification settings
 * 3. Set up push notification credentials in EAS
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerDevice } from "@/api";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configure notification handling behavior.
 * Call this early in app initialization.
 */
export async function configureNotifications(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Configuring notifications...");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Configure Android channels
  await configureAndroidChannels();

  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Notifications configured");
}

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Request notification permissions from the user.
 * Returns true if permissions were granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Requesting permissions...");

  if (!Device.isDevice) {
    // eslint-disable-next-line no-console
    console.log(
      "[PushNotifications] Must use physical device for push notifications",
    );
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    // eslint-disable-next-line no-console
    console.log("[PushNotifications] Permission not granted");
    return false;
  }

  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Permissions granted");
  return true;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get the push notification token and register with backend.
 * Returns the token or null if registration failed.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Registering for push notifications...");

  try {
    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get Expo push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      // eslint-disable-next-line no-console
      console.warn(
        "[PushNotifications] No project ID found. Configure EAS for push notifications.",
      );
      // Still try to get token - might work in development
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });

    const pushToken = tokenResponse.data;
    // eslint-disable-next-line no-console
    console.log("[PushNotifications] Got token:", pushToken);

    // Determine platform
    const platform = Platform.OS === "ios" ? "ios" : "android";

    // Register with backend
    try {
      await registerDevice(pushToken, platform);
      // eslint-disable-next-line no-console
      console.log("[PushNotifications] Registered with backend");
    } catch (backendError) {
      // eslint-disable-next-line no-console
      console.warn(
        "[PushNotifications] Backend registration failed:",
        backendError,
      );
      // Don't fail completely - token is still valid for local use
    }

    return pushToken;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[PushNotifications] Failed to register:", error);
    return null;
  }
}

// ============================================================================
// NOTIFICATION LISTENERS
// ============================================================================

/**
 * Notification handler callback type.
 */
export type NotificationHandler = (data: Record<string, unknown>) => void;

/**
 * Set up notification listeners.
 * Call this after configureNotifications().
 */
export function setupNotificationListeners(
  onNotificationReceived: NotificationHandler,
  onNotificationResponse: NotificationHandler,
): () => void {
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Setting up notification listeners...");

  // Listener for notifications received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      // eslint-disable-next-line no-console
      console.log("[PushNotifications] Notification received:", notification);
      const data = notification.request.content.data || {};
      onNotificationReceived(data);
    },
  );

  // Listener for when user interacts with notification
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      // eslint-disable-next-line no-console
      console.log("[PushNotifications] Notification response:", response);
      const data = response.notification.request.content.data || {};
      onNotificationResponse(data);
    });

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
    // eslint-disable-next-line no-console
    console.log("[PushNotifications] Listeners removed");
  };
}

/**
 * Get the last notification response (for deep linking on app open).
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

// ============================================================================
// BADGE MANAGEMENT
// ============================================================================

/**
 * Set the app badge number.
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Badge count set to:", count);
}

/**
 * Clear the app badge.
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Badge cleared");
}

/**
 * Get current badge count.
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

// ============================================================================
// LOCAL NOTIFICATIONS
// ============================================================================

/**
 * Schedule a local notification.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  secondsFromNow: number = 1,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
      },
    });
    // eslint-disable-next-line no-console
    console.log("[PushNotifications] Local notification scheduled:", id);
    return id;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[PushNotifications] Failed to schedule notification:",
      error,
    );
    return null;
  }
}

/**
 * Show an immediate local notification.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // null trigger = immediate
    });
    // eslint-disable-next-line no-console
    console.log("[PushNotifications] Local notification shown:", id);
    return id;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[PushNotifications] Failed to show notification:", error);
    return null;
  }
}

/**
 * Cancel a scheduled notification.
 */
export async function cancelNotification(
  notificationId: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Notification cancelled:", notificationId);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] All notifications cancelled");
}

/**
 * Get all scheduled notifications.
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ============================================================================
// ANDROID CHANNEL CONFIGURATION
// ============================================================================

/**
 * Configure Android notification channels.
 * Call this during app initialization on Android.
 */
export async function configureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Configuring Android channels...");

  // Messages channel - high priority
  await Notifications.setNotificationChannelAsync("messages", {
    name: "Messages",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF7B3D",
    sound: "default",
    enableVibrate: true,
    enableLights: true,
  });

  // Exchange updates channel - high priority
  await Notifications.setNotificationChannelAsync("exchanges", {
    name: "Exchange Updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF7B3D",
    sound: "default",
    enableVibrate: true,
    enableLights: true,
  });

  // General notifications channel - default priority
  await Notifications.setNotificationChannelAsync("general", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });

  // eslint-disable-next-line no-console
  console.log("[PushNotifications] Android channels configured");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if notifications are enabled.
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Dismiss all displayed notifications.
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  // eslint-disable-next-line no-console
  console.log("[PushNotifications] All notifications dismissed");
}

/**
 * Dismiss a specific notification.
 */
export async function dismissNotification(
  notificationId: string,
): Promise<void> {
  await Notifications.dismissNotificationAsync(notificationId);
}
