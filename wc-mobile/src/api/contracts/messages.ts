/**
 * Messages Contracts
 *
 * CRITICAL FIX: Message format has significant differences:
 *
 * CONVERSATIONS:
 * - Mobile expects: senderId, conversationId, participants[]
 * - Backend returns: sender, otherParticipant (single object, not array)
 *
 * MESSAGES:
 * - Mobile expects: senderId as string
 * - Backend returns: sender as object
 */

import { z } from "zod";
import { BackendPaginationSchema } from "./pagination";
import {
  BackendUserBriefSchema,
  adaptUserBrief,
  type MobileUser,
} from "./common";

// ============================================================================
// BACKEND SCHEMAS
// ============================================================================

/**
 * Backend message format
 */
export const BackendMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  sender: BackendUserBriefSchema,
  content: z.string(),
  type: z.enum(["text", "image", "document", "system"]).default("text"),
  isRead: z.boolean(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type BackendMessage = z.infer<typeof BackendMessageSchema>;

/**
 * Backend conversation format
 */
export const BackendConversationSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid().nullable().optional(),
  // Backend uses otherParticipant (relative to current user)
  otherParticipant: BackendUserBriefSchema,
  lastMessage: BackendMessageSchema.nullable().optional(),
  unreadCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type BackendConversation = z.infer<typeof BackendConversationSchema>;

/**
 * Backend conversations list response
 */
export const BackendConversationsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(BackendConversationSchema),
  pagination: BackendPaginationSchema.optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
  }),
});

export type BackendConversationsListResponse = z.infer<
  typeof BackendConversationsListResponseSchema
>;

/**
 * Backend messages list response
 */
export const BackendMessagesListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(BackendMessageSchema),
  pagination: BackendPaginationSchema.optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
  }),
});

export type BackendMessagesListResponse = z.infer<
  typeof BackendMessagesListResponseSchema
>;

// ============================================================================
// MOBILE MODELS
// ============================================================================

export type MessageType = "text" | "image" | "document" | "system";

/**
 * Mobile message model (UI-friendly)
 */
export interface MobileMessage {
  id: string;
  conversationId: string;
  senderId: string; // Flattened from sender object
  sender: MobileUser;
  content: string;
  type: MessageType;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Mobile conversation model (UI-friendly)
 */
export interface MobileConversation {
  id: string;
  sessionId: string | null;
  // Mobile uses participants array (even if just 2) for consistency
  participants: MobileUser[];
  otherParticipant: MobileUser;
  lastMessage: MobileMessage | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date | null;
}

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Adapts backend message to mobile format
 */
export function adaptMessage(message: BackendMessage): MobileMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.sender.id, // Extract ID for easy comparison
    sender: adaptUserBrief(message.sender),
    content: message.content,
    type: message.type,
    isRead: message.isRead,
    readAt: message.readAt ? new Date(message.readAt) : null,
    createdAt: new Date(message.createdAt),
  };
}

/**
 * Adapts backend conversation to mobile format
 *
 * Note: Backend only returns otherParticipant (relative to current user).
 * Mobile may need the current user in participants array, which should
 * be added from the auth store when needed.
 */
export function adaptConversation(
  conversation: BackendConversation,
  currentUserId?: string,
): MobileConversation {
  const otherParticipant = adaptUserBrief(conversation.otherParticipant);

  // Build participants array
  const participants: MobileUser[] = [otherParticipant];
  if (currentUserId) {
    // Add current user as first participant if ID is provided
    // This maintains consistency with UI expectations
    participants.unshift({
      id: currentUserId,
      displayName: null, // Will be filled from auth store
      avatarUrl: null,
      trustScore: 0,
    });
  }

  return {
    id: conversation.id,
    sessionId: conversation.sessionId ?? null,
    participants,
    otherParticipant,
    lastMessage: conversation.lastMessage
      ? adaptMessage(conversation.lastMessage)
      : null,
    unreadCount: conversation.unreadCount,
    createdAt: new Date(conversation.createdAt),
    updatedAt: conversation.updatedAt ? new Date(conversation.updatedAt) : null,
  };
}

/**
 * Validates and adapts raw message response
 */
export function validateAndAdaptMessage(raw: unknown): MobileMessage {
  const validated = BackendMessageSchema.parse(raw);
  return adaptMessage(validated);
}

/**
 * Validates and adapts raw conversation response
 */
export function validateAndAdaptConversation(
  raw: unknown,
  currentUserId?: string,
): MobileConversation {
  const validated = BackendConversationSchema.parse(raw);
  return adaptConversation(validated, currentUserId);
}

/**
 * Validates and adapts raw conversations list response
 */
export function validateAndAdaptConversationsList(
  raw: unknown,
  currentUserId?: string,
): {
  conversations: MobileConversation[];
  pagination: z.infer<typeof BackendPaginationSchema> | undefined;
} {
  const validated = BackendConversationsListResponseSchema.parse(raw);
  return {
    conversations: validated.data.map((c) =>
      adaptConversation(c, currentUserId),
    ),
    pagination: validated.pagination,
  };
}

/**
 * Validates and adapts raw messages list response
 */
export function validateAndAdaptMessagesList(raw: unknown): {
  messages: MobileMessage[];
  pagination: z.infer<typeof BackendPaginationSchema> | undefined;
} {
  const validated = BackendMessagesListResponseSchema.parse(raw);
  return {
    messages: validated.data.map(adaptMessage),
    pagination: validated.pagination,
  };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Send message request
 */
export interface SendMessageRequest {
  content: string;
  type?: MessageType;
}

/**
 * No adaptation needed for send message - format matches backend
 */
export function adaptSendMessageRequest(
  request: SendMessageRequest,
): SendMessageRequest {
  return request;
}
