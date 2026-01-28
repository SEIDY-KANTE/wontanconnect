/**
 * Messages Module Adapters
 *
 * Bidirectional adapters for messages/conversations between mobile and backend.
 *
 * BACKEND FORMAT (from controller.ts):
 * - Conversation: { id, sessionId, session, otherParticipant, lastMessage, messageCount, updatedAt }
 * - Message: { id, content, type, status, metadata, sender: { id, displayName, avatarUrl }, createdAt }
 *
 * MOBILE EXPECTED FORMAT:
 * - Conversation: { conversationId, participants[], lastMessage, unreadCount, createdAt }
 * - Message: { id, senderId, senderName, content, timestamp, attachments }
 */

import { z } from "zod";

// ============================================================================
// BACKEND SCHEMAS (What the backend actually returns)
// ============================================================================

/**
 * Backend message sender format
 */
export const BackendMessageSenderSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

/**
 * Backend message format from controller.formatMessage()
 */
export const BackendMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  type: z.enum(["text", "image", "location", "system"]),
  status: z.enum(["sent", "delivered", "read"]).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  sender: BackendMessageSenderSchema,
  createdAt: z.string().datetime(),
});

export type BackendMessage = z.infer<typeof BackendMessageSchema>;

/**
 * Backend last message format (subset of full message)
 */
export const BackendLastMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  type: z.enum(["text", "image", "location", "system"]),
  senderId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

/**
 * Backend participant format
 */
export const BackendParticipantSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

/**
 * Backend session info in conversation
 */
export const BackendConversationSessionSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  offer: z
    .object({
      id: z.string().uuid(),
      type: z.enum(["fx", "shipping"]),
      title: z.string().optional(),
    })
    .optional(),
});

/**
 * Backend conversation format from controller.formatConversation()
 */
export const BackendConversationSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  session: BackendConversationSessionSchema,
  otherParticipant: BackendParticipantSchema.nullable(),
  lastMessage: BackendLastMessageSchema.nullable().optional(),
  messageCount: z.number(),
  updatedAt: z.string().datetime(),
});

export type BackendConversation = z.infer<typeof BackendConversationSchema>;

/**
 * Backend unread count response
 */
export const BackendUnreadCountSchema = z.object({
  unreadCount: z.number(),
});

// ============================================================================
// MOBILE TYPES (What the mobile app expects)
// ============================================================================

export interface MobileParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface MobileLastMessage {
  id: string;
  content: string;
  type: "text" | "image" | "location" | "system";
  senderId: string;
  timestamp: Date;
}

export interface MobileConversation {
  conversationId: string;
  sessionId: string;
  session: {
    id: string;
    status: string;
    offerType?: "fx" | "shipping";
  };
  otherParticipant: MobileParticipant | null;
  lastMessage: MobileLastMessage | null;
  messageCount: number;
  unreadCount: number; // NOTE: Backend doesn't return this per-conversation, need separate call
  updatedAt: Date;
}

export interface MobileMessageAttachment {
  url: string;
  type: "image" | "document";
  filename: string;
  size?: number;
}

export interface MobileMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  type: "text" | "image" | "location" | "system";
  status?: "sent" | "delivered" | "read";
  timestamp: Date;
  attachments?: MobileMessageAttachment[];
  metadata?: Record<string, unknown>;
}

export interface MobileSendMessageRequest {
  content: string;
  type?: "text" | "image" | "location" | "system";
  attachments?: MobileMessageAttachment[];
}

// ============================================================================
// ADAPTERS: Backend → Mobile
// ============================================================================

/**
 * Adapt backend conversation to mobile format
 */
export function adaptBackendConversation(raw: unknown): MobileConversation {
  const validated = BackendConversationSchema.parse(raw);

  return {
    conversationId: validated.id,
    sessionId: validated.sessionId,
    session: {
      id: validated.session.id,
      status: validated.session.status,
      offerType: validated.session.offer?.type,
    },
    otherParticipant: validated.otherParticipant
      ? {
          id: validated.otherParticipant.id,
          name: validated.otherParticipant.displayName || "Unknown User",
          avatarUrl: validated.otherParticipant.avatarUrl ?? undefined,
        }
      : null,
    lastMessage: validated.lastMessage
      ? {
          id: validated.lastMessage.id,
          content: validated.lastMessage.content,
          type: validated.lastMessage.type,
          senderId: validated.lastMessage.senderId,
          timestamp: new Date(validated.lastMessage.createdAt),
        }
      : null,
    messageCount: validated.messageCount,
    unreadCount: 0, // Will be populated from separate endpoint or WebSocket
    updatedAt: new Date(validated.updatedAt),
  };
}

/**
 * Adapt array of backend conversations
 */
export function adaptBackendConversations(
  raw: unknown[],
): MobileConversation[] {
  return raw.map(adaptBackendConversation);
}

/**
 * Adapt backend message to mobile format
 */
export function adaptBackendMessage(raw: unknown): MobileMessage {
  const validated = BackendMessageSchema.parse(raw);

  // Extract attachments from metadata if present
  const attachments = extractAttachmentsFromMetadata(validated.metadata);

  return {
    id: validated.id,
    senderId: validated.sender.id,
    senderName: validated.sender.displayName || "Unknown User",
    senderAvatarUrl: validated.sender.avatarUrl ?? undefined,
    content: validated.content,
    type: validated.type,
    status: validated.status,
    timestamp: new Date(validated.createdAt),
    attachments: attachments.length > 0 ? attachments : undefined,
    metadata: validated.metadata ?? undefined,
  };
}

/**
 * Adapt array of backend messages
 */
export function adaptBackendMessages(raw: unknown[]): MobileMessage[] {
  return raw.map(adaptBackendMessage);
}

/**
 * Extract attachments from message metadata
 * Backend stores attachment info in metadata field
 */
function extractAttachmentsFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): MobileMessageAttachment[] {
  if (!metadata) return [];

  const attachments: MobileMessageAttachment[] = [];

  // Check for image URL in metadata
  if (metadata.imageUrl && typeof metadata.imageUrl === "string") {
    attachments.push({
      url: metadata.imageUrl,
      type: "image",
      filename: (metadata.filename as string) || "image.jpg",
      size: metadata.size as number | undefined,
    });
  }

  // Check for document URL in metadata
  if (metadata.documentUrl && typeof metadata.documentUrl === "string") {
    attachments.push({
      url: metadata.documentUrl,
      type: "document",
      filename: (metadata.filename as string) || "document",
      size: metadata.size as number | undefined,
    });
  }

  // Check for attachments array in metadata
  if (Array.isArray(metadata.attachments)) {
    for (const att of metadata.attachments) {
      if (att && typeof att === "object" && "url" in att) {
        attachments.push({
          url: att.url as string,
          type: (att.type as "image" | "document") || "document",
          filename: (att.filename as string) || "attachment",
          size: att.size as number | undefined,
        });
      }
    }
  }

  return attachments;
}

/**
 * Adapt unread count response
 */
export function adaptUnreadCount(raw: unknown): number {
  const validated = BackendUnreadCountSchema.parse(raw);
  return validated.unreadCount;
}

// ============================================================================
// ADAPTERS: Mobile → Backend
// ============================================================================

/**
 * Backend create message request format
 */
export interface BackendCreateMessageRequest {
  content: string;
  type: "text" | "image" | "location" | "system";
  metadata?: Record<string, unknown>;
}

/**
 * Adapt mobile send message request to backend format
 */
export function adaptSendMessageRequest(
  mobile: MobileSendMessageRequest,
): BackendCreateMessageRequest {
  const metadata: Record<string, unknown> = {};

  // If there are attachments, add to metadata
  if (mobile.attachments && mobile.attachments.length > 0) {
    metadata.attachments = mobile.attachments.map((att) => ({
      url: att.url,
      type: att.type,
      filename: att.filename,
      size: att.size,
    }));

    // For single image, also set imageUrl for backward compatibility
    const firstImage = mobile.attachments.find((a) => a.type === "image");
    if (firstImage) {
      metadata.imageUrl = firstImage.url;
      metadata.filename = firstImage.filename;
    }
  }

  return {
    content: mobile.content,
    type: mobile.type || "text",
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a conversation response
 */
export function validateConversation(
  data: unknown,
): BackendConversation | null {
  try {
    return BackendConversationSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Validate a message response
 */
export function validateMessage(data: unknown): BackendMessage | null {
  try {
    return BackendMessageSchema.parse(data);
  } catch {
    return null;
  }
}
