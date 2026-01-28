/**
 * WebSocket Initialization Service
 *
 * Initializes WebSocket connection when user is authenticated
 * and wires up event handlers to the appropriate stores.
 */

import {
  webSocketService,
  onNewMessage,
  onMessageRead,
  onTypingIndicator,
  onSessionUpdate,
  onNewNotification,
  WSNewMessagePayload,
  WSMessageReadPayload,
  WSSessionUpdatePayload,
  WSNotificationPayload,
} from "./webSocket";
import { useMessagesStore } from "@/features/messages/store/messagesStore";
import { useExchangeStore } from "@/features/exchange/store/exchangeStore";

// Track cleanup functions
let cleanupFunctions: (() => void)[] = [];

/**
 * Initialize WebSocket connection and set up event handlers.
 * Call this when the user is authenticated.
 */
export async function initializeWebSocket(): Promise<boolean> {
  console.log("[WebSocketInit] Initializing...");

  // Clean up any existing listeners
  cleanupWebSocket();

  // Connect to WebSocket server
  const connected = await webSocketService.connect();

  if (!connected) {
    console.error("[WebSocketInit] Failed to connect");
    return false;
  }

  console.log("[WebSocketInit] Connected, setting up handlers...");

  // Set up message handlers
  const unsubNewMessage = onNewMessage((payload: WSNewMessagePayload) => {
    console.log("[WebSocketInit] New message received:", payload.id);
    useMessagesStore.getState().handleIncomingMessage(payload);
  });
  cleanupFunctions.push(unsubNewMessage);

  const unsubMessageRead = onMessageRead((payload: WSMessageReadPayload) => {
    console.log("[WebSocketInit] Message read:", payload.messageIds);
    useMessagesStore.getState().handleMessageRead(payload);
  });
  cleanupFunctions.push(unsubMessageRead);

  // Set up typing indicator handler
  const unsubTyping = onTypingIndicator((payload) => {
    console.log(
      "[WebSocketInit] Typing:",
      payload.userId,
      payload.isTyping ? "started" : "stopped",
    );
    useMessagesStore
      .getState()
      .setTyping(payload.conversationId, payload.userId, payload.isTyping);
  });
  cleanupFunctions.push(unsubTyping);

  // Set up session update handler
  const unsubSession = onSessionUpdate((payload: WSSessionUpdatePayload) => {
    console.log(
      "[WebSocketInit] Session update:",
      payload.sessionId,
      payload.status,
    );
    // Refresh sessions when a session status changes
    useExchangeStore.getState().loadSessions();
  });
  cleanupFunctions.push(unsubSession);

  // Set up notification handler
  const unsubNotification = onNewNotification(
    (payload: WSNotificationPayload) => {
      console.log("[WebSocketInit] Notification:", payload.title);
      // TODO: Show in-app notification toast
    },
  );
  cleanupFunctions.push(unsubNotification);

  console.log("[WebSocketInit] All handlers set up");
  return true;
}

/**
 * Clean up WebSocket connection and event handlers.
 * Call this when the user logs out.
 */
export function cleanupWebSocket(): void {
  console.log("[WebSocketInit] Cleaning up...");

  // Unsubscribe from all events
  cleanupFunctions.forEach((cleanup) => cleanup());
  cleanupFunctions = [];

  // Disconnect WebSocket
  webSocketService.disconnect();

  console.log("[WebSocketInit] Cleanup complete");
}

/**
 * Check if WebSocket is currently connected.
 */
export function isWebSocketConnected(): boolean {
  return webSocketService.isConnected();
}
