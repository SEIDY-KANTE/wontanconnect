/**
 * Core Services
 *
 * Central export for all core services.
 */

export {
  configureNotifications,
  requestNotificationPermissions,
  registerForPushNotifications,
  setupNotificationListeners,
  getLastNotificationResponse,
  setBadgeCount,
  clearBadge,
  getBadgeCount,
  scheduleLocalNotification,
  showLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  configureAndroidChannels,
  areNotificationsEnabled,
  dismissAllNotifications,
  dismissNotification,
} from "./pushNotifications";

export type { NotificationHandler } from "./pushNotifications";

export {
  webSocketService,
  sendTypingStart,
  sendTypingStop,
  subscribeToConversation,
  unsubscribeFromConversation,
  subscribeToSession,
  unsubscribeFromSession,
  onNewMessage,
  onMessageRead,
  onTypingIndicator,
  onSessionUpdate,
  onNewNotification,
} from "./webSocket";

export type {
  WebSocketEvent,
  WebSocketMessage,
  WebSocketEventHandler,
  WSNewMessagePayload,
  WSMessageReadPayload,
  WSSessionUpdatePayload,
  WSNotificationPayload,
} from "./webSocket";

export {
  initializeWebSocket,
  cleanupWebSocket,
  isWebSocketConnected,
} from "./webSocketInit";
