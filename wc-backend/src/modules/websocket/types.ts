/**
 * WebSocket Types
 */

import { WebSocket } from 'ws';

/**
 * Authenticated WebSocket connection
 */
export interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  isAlive: boolean;
  sessionIds?: string[]; // Sessions user is part of
  ip?: string;
}

/**
 * WebSocket message types
 */
export type WSMessageType =
  | 'authenticate'
  | 'authenticated'
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'typing_start'
  | 'typing_stop'
  | 'new_message'
  | 'message_read'
  | 'session_update'
  | 'notification'
  | 'error';

/**
 * Base WebSocket message structure
 */
export interface WSMessage {
  type: WSMessageType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  timestamp?: string;
}

/**
 * Authentication payload
 */
export interface WSAuthenticatePayload {
  token: string;
}

/**
 * Subscribe to conversation/session updates
 */
export interface WSSubscribePayload {
  conversationId?: string;
  sessionId?: string;
}

/**
 * Typing indicator payload
 */
export interface WSTypingPayload {
  conversationId: string;
  userId: string;
}

/**
 * New message payload
 */
export interface WSNewMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}

/**
 * Message read payload
 */
export interface WSMessageReadPayload {
  conversationId: string;
  messageIds: string[];
  readBy: string;
  readAt: string;
}

/**
 * Session update payload
 */
export interface WSSessionUpdatePayload {
  sessionId: string;
  status: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * Notification payload
 */
export interface WSNotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Error payload
 */
export interface WSErrorPayload {
  code: string;
  message: string;
}
