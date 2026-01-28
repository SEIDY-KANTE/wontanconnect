/**
 * WebSocket Server
 *
 * Real-time messaging and notifications for WontanConnect.
 * Handles:
 * - Authentication via JWT token
 * - Typing indicators
 * - New message broadcasts
 * - Session status updates
 * - Push notifications relay
 */

import { Server as HTTPServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { URL } from 'url';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { verifyAccessToken } from '../../middleware/auth.js';
import { messageRepository } from '../messages/repository.js';
import { sessionRepository } from '../sessions/repository.js';
import {
  AuthenticatedWebSocket,
  WSMessage,
  WSAuthenticatePayload,
  WSTypingPayload,
  WSNewMessagePayload,
  WSMessageReadPayload,
  WSSessionUpdatePayload,
  WSNotificationPayload,
  WSSubscribePayload,
} from './types.js';

// Extend IncomingMessage to include userId
interface AuthenticatedRequest extends IncomingMessage {
  userId?: string;
}

interface PendingConnection {
  ws: WebSocket;
  ip: string;
  timeout: ReturnType<typeof setTimeout>;
}

interface RateLimitState {
  count: number;
  windowStart: number;
}

// Store connected clients by userId
const clients = new Map<string, Set<AuthenticatedWebSocket>>();

// Store conversation subscriptions (conversationId -> Set of userIds)
const conversationSubscriptions = new Map<string, Set<string>>();

// Store session subscriptions (sessionId -> Set of userIds)
const sessionSubscriptions = new Map<string, Set<string>>();

// Pending unauthenticated connections
const pendingConnections = new Map<WebSocket, PendingConnection>();

// Connection and message rate tracking
const connectionsPerIp = new Map<string, number>();
const wsRateLimits = new Map<string, RateLimitState>();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

const WS_V2_AUTH = env.WS_V2_AUTH;
const WS_TRUST_PROXY = env.WS_TRUST_PROXY;
const WS_AUTH_TIMEOUT_MS = env.WS_AUTH_TIMEOUT_MS;
const WS_MAX_CONNECTIONS_PER_USER = env.WS_MAX_CONNECTIONS_PER_USER;
const WS_MAX_CONNECTIONS_PER_IP = env.WS_MAX_CONNECTIONS_PER_IP;
const WS_MESSAGE_RATE_LIMIT = env.WS_MESSAGE_RATE_LIMIT;
const WS_MESSAGE_RATE_WINDOW_MS = env.WS_MESSAGE_RATE_WINDOW_MS;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient: WS_V2_AUTH
      ? undefined
      : async (info, callback) => {
          try {
            // Extract token from query string
            const url = new URL(info.req.url || '', `http://${info.req.headers.host}`);
            const token = url.searchParams.get('token');

            if (!token) {
              logger.warn('WebSocket connection rejected: No token provided');
              callback(false, 401, 'Unauthorized');
              return;
            }

            // Verify token
            const decoded = await verifyAccessToken(token);
            if (!decoded || !decoded.userId) {
              logger.warn('WebSocket connection rejected: Invalid token');
              callback(false, 401, 'Invalid token');
              return;
            }

            // Attach userId to request for later use
            (info.req as AuthenticatedRequest).userId = decoded.userId;
            callback(true);
          } catch (error) {
            logger.error({ error }, 'WebSocket auth error');
            callback(false, 401, 'Authentication failed');
          }
        },
  });

  // Handle new connections
  wss.on('connection', (ws: WebSocket, req: AuthenticatedRequest) => {
    const ip = getClientIp(req);

    if (!incrementIpConnection(ip)) {
      logger.warn({ ip }, 'WebSocket connection rejected: IP limit exceeded');
      ws.close(4029, 'Too many connections from this IP');
      return;
    }

    const socket = ws as AuthenticatedWebSocket;
    socket.ip = ip;
    socket.isAlive = true;
    socket.sessionIds = [];

    attachSocketHandlers(socket);

    if (WS_V2_AUTH) {
      startAuthTimeout(socket);
      return;
    }

    const userId = req.userId;
    if (!userId) {
      logger.warn({ ip }, 'WebSocket connection rejected: Missing userId');
      socket.close(4001, 'Authentication failed');
      return;
    }

    if (!registerAuthenticatedSocket(socket, userId)) {
      return;
    }

    // Send welcome message
    sendMessage(socket, {
      type: 'pong',
      payload: { connected: true, userId },
      timestamp: new Date().toISOString(),
    });
  });

  // Start heartbeat interval
  heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;
      if (!authWs.isAlive) {
        logger.debug({ userId: authWs.userId }, 'Terminating inactive WebSocket');
        authWs.terminate();
        return;
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  });

  logger.info('WebSocket server initialized on /ws');
  return wss;
}

function getClientIp(req: IncomingMessage): string {
  if (!WS_TRUST_PROXY) {
    return req.socket.remoteAddress || 'unknown';
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function incrementIpConnection(ip: string): boolean {
  const current = connectionsPerIp.get(ip) ?? 0;
  if (current >= WS_MAX_CONNECTIONS_PER_IP) {
    return false;
  }
  connectionsPerIp.set(ip, current + 1);
  return true;
}

function decrementIpConnection(ip?: string): void {
  if (!ip) return;
  const current = connectionsPerIp.get(ip);
  if (!current) return;
  if (current <= 1) {
    connectionsPerIp.delete(ip);
    return;
  }
  connectionsPerIp.set(ip, current - 1);
}

function attachSocketHandlers(ws: AuthenticatedWebSocket): void {
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    void handleSocketMessage(ws, data);
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    logger.error({ error, userId: ws.userId, ip: ws.ip }, 'WebSocket error');
    handleDisconnect(ws);
  });
}

async function handleSocketMessage(ws: AuthenticatedWebSocket, data: RawData): Promise<void> {
  let message: WSMessage;

  try {
    message = JSON.parse(data.toString()) as WSMessage;
  } catch (error) {
    logger.error({ error, userId: ws.userId, ip: ws.ip }, 'Invalid WebSocket message');
    sendError(ws, 'INVALID_MESSAGE', 'Invalid message format');
    return;
  }

  if (WS_V2_AUTH && !ws.userId) {
    await handleAuthentication(ws, message);
    return;
  }

  try {
    await handleMessage(ws, message);
  } catch (error) {
    logger.error({ error, userId: ws.userId, ip: ws.ip }, 'WebSocket message handler error');
    sendError(ws, 'INTERNAL_ERROR', 'Internal WebSocket error');
  }
}

function startAuthTimeout(ws: AuthenticatedWebSocket): void {
  if (pendingConnections.has(ws)) return;

  const ip = ws.ip ?? 'unknown';
  const timeout = setTimeout(() => {
    logger.warn({ ip }, 'WebSocket auth timeout');
    ws.close(4001, 'Authentication timeout');
    clearPendingConnection(ws);
  }, WS_AUTH_TIMEOUT_MS);

  pendingConnections.set(ws, { ws, ip, timeout });
}

function clearPendingConnection(ws: WebSocket): void {
  const pending = pendingConnections.get(ws);
  if (!pending) return;
  clearTimeout(pending.timeout);
  pendingConnections.delete(ws);
}

async function handleAuthentication(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
  if (message.type !== 'authenticate') {
    sendError(ws, 'NOT_AUTHENTICATED', 'Send authenticate message first');
    return;
  }

  const payload = message.payload as WSAuthenticatePayload | undefined;
  const token = payload?.token;

  if (!token || typeof token !== 'string') {
    sendError(ws, 'INVALID_MESSAGE', 'Authentication token required');
    return;
  }

  try {
    const decoded = await verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      logger.warn({ ip: ws.ip }, 'WebSocket authentication failed: Invalid token');
      clearPendingConnection(ws);
      ws.close(4001, 'Invalid token');
      return;
    }

    if (!registerAuthenticatedSocket(ws, decoded.userId)) {
      clearPendingConnection(ws);
      return;
    }

    clearPendingConnection(ws);

    sendMessage(ws, {
      type: 'authenticated',
      payload: { userId: decoded.userId },
      timestamp: new Date().toISOString(),
    });

    sendMessage(ws, {
      type: 'pong',
      payload: { connected: true, userId: decoded.userId },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, ip: ws.ip }, 'WebSocket authentication failed');
    clearPendingConnection(ws);
    ws.close(4001, 'Authentication failed');
  }
}

function registerAuthenticatedSocket(ws: AuthenticatedWebSocket, userId: string): boolean {
  const existingConnections = clients.get(userId);
  if (existingConnections && existingConnections.size >= WS_MAX_CONNECTIONS_PER_USER) {
    logger.warn({ userId, ip: ws.ip }, 'WebSocket connection rejected: User limit exceeded');
    ws.close(4029, 'Too many connections for this user');
    return false;
  }

  ws.userId = userId;
  ws.isAlive = true;
  ws.sessionIds = [];

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(ws);

  logger.info({ userId, ip: ws.ip }, 'WebSocket client connected');
  return true;
}

function checkMessageRateLimit(userId: string): boolean {
  const now = Date.now();
  const existing = wsRateLimits.get(userId);

  if (!existing || now - existing.windowStart > WS_MESSAGE_RATE_WINDOW_MS) {
    wsRateLimits.set(userId, { count: 1, windowStart: now });
    return true;
  }

  existing.count += 1;
  if (existing.count > WS_MESSAGE_RATE_LIMIT) {
    return false;
  }

  return true;
}

/**
 * Handle incoming WebSocket messages
 */
async function handleMessage(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
  const { type, payload } = message;

  switch (type) {
    case 'ping':
      sendMessage(ws, { type: 'pong', timestamp: new Date().toISOString() });
      break;

    case 'subscribe':
      if (!checkMessageRateLimit(ws.userId)) {
        sendError(ws, 'RATE_LIMITED', 'Too many messages, slow down');
        return;
      }
      await handleSubscribe(ws, payload as unknown as WSSubscribePayload);
      break;

    case 'unsubscribe':
      if (!checkMessageRateLimit(ws.userId)) {
        sendError(ws, 'RATE_LIMITED', 'Too many messages, slow down');
        return;
      }
      handleUnsubscribe(ws, payload as unknown as WSSubscribePayload);
      break;

    case 'typing_start':
      if (!checkMessageRateLimit(ws.userId)) {
        sendError(ws, 'RATE_LIMITED', 'Too many messages, slow down');
        return;
      }
      handleTypingStart(ws, payload as unknown as WSTypingPayload);
      break;

    case 'typing_stop':
      if (!checkMessageRateLimit(ws.userId)) {
        sendError(ws, 'RATE_LIMITED', 'Too many messages, slow down');
        return;
      }
      handleTypingStop(ws, payload as unknown as WSTypingPayload);
      break;

    default:
      logger.warn({ type, userId: ws.userId }, 'Unknown WebSocket message type');
      sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${type}`);
  }
}

/**
 * Handle subscription to conversation/session
 */
async function handleSubscribe(
  ws: AuthenticatedWebSocket,
  payload: WSSubscribePayload
): Promise<void> {
  if (payload.conversationId) {
    const isParticipant = await messageRepository.isParticipant(
      payload.conversationId,
      ws.userId
    );

    if (!isParticipant) {
      sendError(ws, 'FORBIDDEN', 'Not a participant in this conversation');
      logger.warn(
        { userId: ws.userId, conversationId: payload.conversationId },
        'Unauthorized conversation subscription attempt'
      );
    } else {
      if (!conversationSubscriptions.has(payload.conversationId)) {
        conversationSubscriptions.set(payload.conversationId, new Set());
      }
      conversationSubscriptions.get(payload.conversationId)!.add(ws.userId);
      logger.debug(
        { userId: ws.userId, conversationId: payload.conversationId },
        'Subscribed to conversation'
      );
    }
  }

  if (payload.sessionId) {
    const isParticipant = await sessionRepository.isParticipant(payload.sessionId, ws.userId);

    if (!isParticipant) {
      sendError(ws, 'FORBIDDEN', 'Not a participant in this session');
      logger.warn(
        { userId: ws.userId, sessionId: payload.sessionId },
        'Unauthorized session subscription attempt'
      );
    } else {
      if (!sessionSubscriptions.has(payload.sessionId)) {
        sessionSubscriptions.set(payload.sessionId, new Set());
      }
      sessionSubscriptions.get(payload.sessionId)!.add(ws.userId);
      ws.sessionIds = ws.sessionIds ?? [];
      if (!ws.sessionIds.includes(payload.sessionId)) {
        ws.sessionIds.push(payload.sessionId);
      }
      logger.debug({ userId: ws.userId, sessionId: payload.sessionId }, 'Subscribed to session');
    }
  }
}

/**
 * Handle unsubscription from conversation/session
 */
function handleUnsubscribe(ws: AuthenticatedWebSocket, payload: WSSubscribePayload): void {
  if (payload.conversationId) {
    conversationSubscriptions.get(payload.conversationId)?.delete(ws.userId);
    logger.debug(
      { userId: ws.userId, conversationId: payload.conversationId },
      'Unsubscribed from conversation'
    );
  }

  if (payload.sessionId) {
    sessionSubscriptions.get(payload.sessionId)?.delete(ws.userId);
    ws.sessionIds = ws.sessionIds?.filter((id) => id !== payload.sessionId);
    logger.debug({ userId: ws.userId, sessionId: payload.sessionId }, 'Unsubscribed from session');
  }
}

/**
 * Handle typing start indicator
 */
function handleTypingStart(ws: AuthenticatedWebSocket, payload: WSTypingPayload): void {
  broadcastToConversation(
    payload.conversationId,
    {
      type: 'typing_start',
      payload: {
        conversationId: payload.conversationId,
        userId: ws.userId,
      },
      timestamp: new Date().toISOString(),
    },
    ws.userId
  ); // Exclude sender
}

/**
 * Handle typing stop indicator
 */
function handleTypingStop(ws: AuthenticatedWebSocket, payload: WSTypingPayload): void {
  broadcastToConversation(
    payload.conversationId,
    {
      type: 'typing_stop',
      payload: {
        conversationId: payload.conversationId,
        userId: ws.userId,
      },
      timestamp: new Date().toISOString(),
    },
    ws.userId
  ); // Exclude sender
}

/**
 * Handle client disconnect
 */
function handleDisconnect(ws: WebSocket): void {
  const authWs = ws as AuthenticatedWebSocket;
  const userId = authWs.userId;

  clearPendingConnection(ws);

  if (userId) {
    // Remove from clients
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(authWs);
      if (userClients.size === 0) {
        clients.delete(userId);
        wsRateLimits.delete(userId);
      }
    }

    // Remove from conversation subscriptions
    conversationSubscriptions.forEach((users, conversationId) => {
      users.delete(userId);
      if (users.size === 0) {
        conversationSubscriptions.delete(conversationId);
      }
    });

    // Remove from session subscriptions
    authWs.sessionIds?.forEach((sessionId) => {
      sessionSubscriptions.get(sessionId)?.delete(userId);
    });
  }

  decrementIpConnection(authWs.ip);

  logger.info({ userId, ip: authWs.ip }, 'WebSocket client disconnected');
}

/**
 * Send message to a specific WebSocket
 */
function sendMessage(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Send error to a WebSocket
 */
function sendError(ws: WebSocket, code: string, message: string): void {
  sendMessage(ws, {
    type: 'error',
    payload: { code, message },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast to all clients of a user
 */
export function broadcastToUser(userId: string, message: WSMessage): void {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.forEach((ws) => {
      sendMessage(ws, message);
    });
  }
}

/**
 * Broadcast to all subscribers of a conversation
 */
export function broadcastToConversation(
  conversationId: string,
  message: WSMessage,
  excludeUserId?: string
): void {
  const subscribers = conversationSubscriptions.get(conversationId);
  if (subscribers) {
    subscribers.forEach((userId) => {
      if (userId !== excludeUserId) {
        broadcastToUser(userId, message);
      }
    });
  }
}

/**
 * Broadcast to all subscribers of a session
 */
export function broadcastToSession(
  sessionId: string,
  message: WSMessage,
  excludeUserId?: string
): void {
  const subscribers = sessionSubscriptions.get(sessionId);
  if (subscribers) {
    subscribers.forEach((userId) => {
      if (userId !== excludeUserId) {
        broadcastToUser(userId, message);
      }
    });
  }
}

// ============================================================================
// PUBLIC BROADCAST FUNCTIONS (called from services)
// ============================================================================

/**
 * Broadcast new message to conversation participants
 */
export function broadcastNewMessage(
  conversationId: string,
  participantIds: string[],
  messageData: WSNewMessagePayload
): void {
  const message: WSMessage = {
    type: 'new_message',
    payload: messageData,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all participants (they might not be subscribed yet)
  participantIds.forEach((userId) => {
    if (userId !== messageData.senderId) {
      broadcastToUser(userId, message);
    }
  });

  // Also broadcast to conversation subscribers
  broadcastToConversation(conversationId, message, messageData.senderId);
}

/**
 * Broadcast message read receipt
 */
export function broadcastMessageRead(
  _conversationId: string,
  participantIds: string[],
  readData: WSMessageReadPayload
): void {
  const message: WSMessage = {
    type: 'message_read',
    payload: readData,
    timestamp: new Date().toISOString(),
  };

  participantIds.forEach((userId) => {
    if (userId !== readData.readBy) {
      broadcastToUser(userId, message);
    }
  });
}

/**
 * Broadcast session status update
 */
export function broadcastSessionUpdate(
  sessionId: string,
  participantIds: string[],
  updateData: WSSessionUpdatePayload
): void {
  const message: WSMessage = {
    type: 'session_update',
    payload: updateData,
    timestamp: new Date().toISOString(),
  };

  participantIds.forEach((userId) => {
    broadcastToUser(userId, message);
  });

  // Also broadcast to session subscribers
  broadcastToSession(sessionId, message);
}

/**
 * Send notification to a user
 */
export function sendNotificationToUser(
  userId: string,
  notificationData: WSNotificationPayload
): void {
  const message: WSMessage = {
    type: 'notification',
    payload: notificationData,
    timestamp: new Date().toISOString(),
  };

  broadcastToUser(userId, message);
}

/**
 * Check if a user is online (has at least one connected WebSocket)
 */
export function isUserOnline(userId: string): boolean {
  const userClients = clients.get(userId);
  return !!userClients && userClients.size > 0;
}

/**
 * Get count of connected clients
 */
export function getConnectedClientsCount(): number {
  let count = 0;
  clients.forEach((userClients) => {
    count += userClients.size;
  });
  return count;
}

/**
 * Get count of unique connected users
 */
export function getConnectedUsersCount(): number {
  return clients.size;
}
