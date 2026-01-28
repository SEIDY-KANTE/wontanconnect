/**
 * WebSocket Service (SECURE VERSION)
 *
 * Secure real-time communication with:
 * - Token passed in message payload, NOT in URL (security fix)
 * - Automatic token rotation after refresh
 * - Exponential backoff reconnection
 * - Heartbeat mechanism for connection health
 * - Proper cleanup and memory management
 */

import { config, debugLog, errorLog, WEBSOCKET } from "@/config";
import { getAccessToken } from "@/api/storage";

// ============================================================================
// TYPES
// ============================================================================

export type WebSocketEvent =
  | "authenticate"
  | "authenticated"
  | "refresh_token"
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

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEvent;
  payload?: T;
  timestamp?: string;
}

export interface WSNewMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}

export interface WSMessageReadPayload {
  conversationId: string;
  messageIds: string[];
  readBy: string;
  readAt: string;
}

export interface WSSessionUpdatePayload {
  sessionId: string;
  status: string;
  updatedBy: string;
  updatedAt: string;
}

export interface WSNotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export type WebSocketEventHandler<T = unknown> = (payload: T) => void;

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  AUTHENTICATING = "authenticating",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
}

// ============================================================================
// SECURE WEBSOCKET SERVICE
// ============================================================================

class SecureWebSocketService {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<WebSocketEvent, Set<WebSocketEventHandler>> =
    new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private isIntentionallyClosed = false;
  private pendingMessages: WebSocketMessage[] = [];

  // Expose connection state for UI
  public onConnectionStateChange?: (state: ConnectionState) => void;

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected and authenticated
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Connect to the WebSocket server.
   *
   * SECURITY: Token is NOT passed in URL. Connection is established first,
   * then authentication happens via message payload.
   */
  async connect(): Promise<boolean> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      debugLog("WebSocket", "Already connected");
      return true;
    }

    if (
      this.connectionState === ConnectionState.CONNECTING ||
      this.connectionState === ConnectionState.AUTHENTICATING
    ) {
      debugLog("WebSocket", "Connection already in progress");
      return false;
    }

    this.isIntentionallyClosed = false;
    this.setConnectionState(ConnectionState.CONNECTING);

    try {
      const token = await getAccessToken();
      if (!token) {
        errorLog("WebSocket", "No access token available");
        this.setConnectionState(ConnectionState.DISCONNECTED);
        return false;
      }

      // SECURITY: Connect WITHOUT token in URL
      const wsUrl = config.wsBaseUrl;
      debugLog("WebSocket", "Connecting to:", wsUrl);

      return new Promise((resolve) => {
        this.ws = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          debugLog("WebSocket", "Connection timeout");
          this.ws?.close();
          this.setConnectionState(ConnectionState.DISCONNECTED);
          resolve(false);
        }, WEBSOCKET.CONNECTION_TIMEOUT);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          debugLog("WebSocket", "Connection opened, authenticating...");
          this.setConnectionState(ConnectionState.AUTHENTICATING);

          // SECURITY: Send token in message payload, not URL
          this.sendImmediate({
            type: "authenticate",
            payload: { token },
          });
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          debugLog("WebSocket", "Disconnected:", event.code, event.reason);
          this.stopHeartbeat();

          if (!this.isIntentionallyClosed) {
            this.setConnectionState(ConnectionState.RECONNECTING);
            this.scheduleReconnect();
          } else {
            this.setConnectionState(ConnectionState.DISCONNECTED);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          errorLog("WebSocket", "Error:", error);
          this.setConnectionState(ConnectionState.DISCONNECTED);
          resolve(false);
        };

        this.ws.onmessage = (event) => {
          const message = this.parseMessage(event.data);
          if (!message) return;

          // Handle authentication response
          if (message.type === "authenticated") {
            debugLog("WebSocket", "Authentication successful");
            this.setConnectionState(ConnectionState.CONNECTED);
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.flushPendingMessages();
            resolve(true);
            return;
          }

          // Handle authentication error
          if (
            message.type === "error" &&
            this.connectionState === ConnectionState.AUTHENTICATING
          ) {
            errorLog("WebSocket", "Authentication failed:", message.payload);
            this.setConnectionState(ConnectionState.DISCONNECTED);
            resolve(false);
            return;
          }

          // Handle other messages
          this.handleMessage(message);
        };
      });
    } catch (error) {
      errorLog("WebSocket", "Connection failed:", error);
      this.setConnectionState(ConnectionState.DISCONNECTED);
      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    debugLog("WebSocket", "Disconnecting...");
    this.isIntentionallyClosed = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.pendingMessages = [];
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  /**
   * Refresh token after auth refresh.
   *
   * CRITICAL: This should be called after the auth token is refreshed
   * to update the WebSocket session with the new token.
   */
  async refreshToken(): Promise<void> {
    if (!this.isConnected()) {
      debugLog("WebSocket", "Not connected, skipping token refresh");
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      errorLog("WebSocket", "No token available for refresh");
      return;
    }

    debugLog("WebSocket", "Refreshing WebSocket token");
    this.send({
      type: "refresh_token",
      payload: { token },
    });
  }

  /**
   * Send a message through the WebSocket.
   * Messages are queued if not yet connected.
   */
  send(message: WebSocketMessage): void {
    if (this.connectionState === ConnectionState.CONNECTED) {
      this.sendImmediate(message);
    } else {
      debugLog("WebSocket", "Queueing message:", message.type);
      this.pendingMessages.push(message);
    }
  }

  /**
   * Subscribe to a WebSocket event.
   */
  on<T = unknown>(
    event: WebSocketEvent,
    handler: WebSocketEventHandler<T>,
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as WebSocketEventHandler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler as WebSocketEventHandler);
    };
  }

  /**
   * Remove all handlers for an event.
   */
  off(event: WebSocketEvent): void {
    this.eventHandlers.delete(event);
  }

  /**
   * Subscribe to a conversation for real-time updates.
   */
  subscribeToConversation(conversationId: string): void {
    this.send({
      type: "subscribe",
      payload: { channel: "conversation", conversationId },
    });
  }

  /**
   * Unsubscribe from a conversation.
   */
  unsubscribeFromConversation(conversationId: string): void {
    this.send({
      type: "unsubscribe",
      payload: { channel: "conversation", conversationId },
    });
  }

  /**
   * Send typing indicator.
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    this.send({
      type: isTyping ? "typing_start" : "typing_stop",
      payload: { conversationId },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      debugLog("WebSocket", "State change:", this.connectionState, "→", state);
      this.connectionState = state;
      this.onConnectionStateChange?.(state);
    }
  }

  private sendImmediate(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      });
      this.ws.send(payload);
      debugLog("WebSocket", "Sent:", message.type);
    }
  }

  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.sendImmediate(message);
      }
    }
  }

  private parseMessage(data: string): WebSocketMessage | null {
    try {
      return JSON.parse(data) as WebSocketMessage;
    } catch {
      errorLog("WebSocket", "Failed to parse message:", data);
      return null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    debugLog("WebSocket", "Received:", message.type);

    // Handle pong for heartbeat
    if (message.type === "pong") {
      return;
    }

    // Dispatch to handlers
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.payload ?? {});
        } catch (error) {
          errorLog("WebSocket", "Handler error:", error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendImmediate({ type: "ping" });
      }
    }, WEBSOCKET.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) return;

    if (this.reconnectAttempts >= WEBSOCKET.MAX_RECONNECT_ATTEMPTS) {
      errorLog("WebSocket", "Max reconnect attempts reached");
      this.setConnectionState(ConnectionState.DISCONNECTED);
      return;
    }

    // Exponential backoff
    const delay = Math.min(
      WEBSOCKET.RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts),
      30000, // Max 30 seconds
    );

    debugLog(
      "WebSocket",
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`,
    );

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      await this.connect();
    }, delay);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const websocketService = new SecureWebSocketService();

// Export type for connection state listeners
export type { SecureWebSocketService };
