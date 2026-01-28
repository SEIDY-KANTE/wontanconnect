/**
 * WebSocket Service
 *
 * Handles real-time communication with the backend for:
 * - Live message updates
 * - Typing indicators
 * - Session status changes
 * - Notifications
 */

import { getAccessToken } from "@/api/storage";

// ============================================================================
// TYPES (matching backend WebSocket types)
// ============================================================================

export type WebSocketEvent =
  | "ping"
  | "pong"
  | "subscribe"
  | "unsubscribe"
  | "typing_start"
  | "typing_stop"
  | "new_message"
  | "message_read"
  | "session_update"
  | "notification"
  | "error";

export interface WebSocketMessage {
  type: WebSocketEvent;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

/** New message payload from server */
export interface WSNewMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}

/** Message read payload from server */
export interface WSMessageReadPayload {
  conversationId: string;
  messageIds: string[];
  readBy: string;
  readAt: string;
}

/** Session update payload from server */
export interface WSSessionUpdatePayload {
  sessionId: string;
  status: string;
  updatedBy: string;
  updatedAt: string;
}

/** Notification payload from server */
export interface WSNotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export type WebSocketEventHandler = (payload: Record<string, unknown>) => void;

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * ⚠️ IMPORTANT: Must match the LOCAL_IP in api/config.ts
 * For physical devices, use your computer's local IP address.
 */
const LOCAL_IP = "192.168.1.104"; // ← Your computer's local IP (same as api/config.ts)

const WS_URL = "wss://api.wontanconnect.com/ws"; // Production
const WS_URL_DEV = `ws://${LOCAL_IP}:3000/ws`; // Physical device / Expo Go
// For Android emulator, use ws://10.0.2.2:3000/ws
// For iOS simulator, use ws://localhost:3000/ws

const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 25000; // 25 seconds (server timeout is 35s)

// ============================================================================
// WEBSOCKET SERVICE
// ============================================================================

class WebSocketService {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<WebSocketEvent, Set<WebSocketEventHandler>> =
    new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;
  private isIntentionallyClosed = false;

  /**
   * Connect to the WebSocket server.
   */
  async connect(): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Already connected");
      return true;
    }

    if (this.isConnecting) {
      console.log("[WebSocket] Connection already in progress");
      return false;
    }

    this.isConnecting = true;
    this.isIntentionallyClosed = false;

    try {
      const token = await getAccessToken();
      if (!token) {
        console.error("[WebSocket] No access token available");
        this.isConnecting = false;
        return false;
      }

      // Use dev URL in development
      const wsUrl = __DEV__ ? WS_URL_DEV : WS_URL;

      console.log("[WebSocket] Connecting to:", wsUrl);

      // Create WebSocket with auth token
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);

      return new Promise((resolve) => {
        if (!this.ws) {
          resolve(false);
          return;
        }

        this.ws.onopen = () => {
          console.log("[WebSocket] Connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onclose = (event) => {
          console.log("[WebSocket] Disconnected:", event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();

          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          this.isConnecting = false;
          resolve(false);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      });
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    console.log("[WebSocket] Disconnecting...");
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    console.log("[WebSocket] Disconnected");
  }

  /**
   * Send a message through the WebSocket.
   */
  send(type: WebSocketEvent, payload: Record<string, unknown>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] Not connected, cannot send message");
      return false;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[WebSocket] Failed to send message:", error);
      return false;
    }
  }

  /**
   * Subscribe to a WebSocket event.
   */
  on(event: WebSocketEvent, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from a WebSocket event.
   */
  off(event: WebSocketEvent, handler: WebSocketEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Check if WebSocket is connected.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      // Handle pong silently (heartbeat response)
      if (message.type === "pong") {
        return;
      }

      console.log("[WebSocket] Received:", message.type);

      const handlers = this.eventHandlers.get(message.type);
      if (handlers && message.payload) {
        handlers.forEach((handler) => {
          try {
            handler(message.payload!);
          } catch (error) {
            console.error("[WebSocket] Handler error for", message.type, error);
          }
        });
      }
    } catch (error) {
      console.error("[WebSocket] Failed to parse message:", error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("[WebSocket] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = RECONNECT_INTERVAL * this.reconnectAttempts;

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const webSocketService = new WebSocketService();

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

/**
 * Subscribe to a conversation for updates.
 */
export function subscribeToConversation(conversationId: string): boolean {
  return webSocketService.send("subscribe", { conversationId });
}

/**
 * Unsubscribe from a conversation.
 */
export function unsubscribeFromConversation(conversationId: string): boolean {
  return webSocketService.send("unsubscribe", { conversationId });
}

/**
 * Subscribe to a session for updates.
 */
export function subscribeToSession(sessionId: string): boolean {
  return webSocketService.send("subscribe", { sessionId });
}

/**
 * Unsubscribe from a session.
 */
export function unsubscribeFromSession(sessionId: string): boolean {
  return webSocketService.send("unsubscribe", { sessionId });
}

/**
 * Send typing start indicator.
 */
export function sendTypingStart(conversationId: string): boolean {
  return webSocketService.send("typing_start", { conversationId });
}

/**
 * Send typing stop indicator.
 */
export function sendTypingStop(conversationId: string): boolean {
  return webSocketService.send("typing_stop", { conversationId });
}

/**
 * Subscribe to new messages.
 */
export function onNewMessage(
  handler: (payload: WSNewMessagePayload) => void,
): () => void {
  return webSocketService.on("new_message", (payload) => {
    handler(payload as unknown as WSNewMessagePayload);
  });
}

/**
 * Subscribe to message read receipts.
 */
export function onMessageRead(
  handler: (payload: WSMessageReadPayload) => void,
): () => void {
  return webSocketService.on("message_read", (payload) => {
    handler(payload as unknown as WSMessageReadPayload);
  });
}

/**
 * Subscribe to typing indicators.
 */
export function onTypingIndicator(
  handler: (payload: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void,
): () => void {
  const startUnsub = webSocketService.on("typing_start", (payload) => {
    handler({
      ...(payload as { conversationId: string; userId: string }),
      isTyping: true,
    });
  });

  const stopUnsub = webSocketService.on("typing_stop", (payload) => {
    handler({
      ...(payload as { conversationId: string; userId: string }),
      isTyping: false,
    });
  });

  return () => {
    startUnsub();
    stopUnsub();
  };
}

/**
 * Subscribe to session updates.
 */
export function onSessionUpdate(
  handler: (payload: WSSessionUpdatePayload) => void,
): () => void {
  return webSocketService.on("session_update", (payload) => {
    handler(payload as unknown as WSSessionUpdatePayload);
  });
}

/**
 * Subscribe to new notifications.
 */
export function onNewNotification(
  handler: (payload: WSNotificationPayload) => void,
): () => void {
  return webSocketService.on("notification", (payload) => {
    handler(payload as unknown as WSNotificationPayload);
  });
}
