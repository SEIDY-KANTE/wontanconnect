/**
 * Messages Types
 *
 * Enhanced messaging data models supporting:
 * - Multiple message types (text, image, document, system)
 * - Message delivery/seen states
 * - Exchange-aware context
 * - Typing indicators
 */

import { ExchangeType, ExchangeStatus } from "@/features/exchange/model/types";

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Message types supported by the chat system
 */
export type MessageType = "TEXT" | "IMAGE" | "DOCUMENT" | "SYSTEM";

/**
 * Message delivery status
 */
export type MessageStatus =
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "SEEN"
  | "FAILED";

/**
 * System message event types
 */
export type SystemMessageEvent =
  | "EXCHANGE_REQUEST_SENT"
  | "EXCHANGE_ACCEPTED"
  | "EXCHANGE_DECLINED"
  | "EXCHANGE_CANCELLED"
  | "USER_MARKED_SENT"
  | "USER_CONFIRMED_RECEIPT"
  | "EXCHANGE_COMPLETED"
  | "EXCHANGE_IN_TRANSIT"
  | "EXCHANGE_DELIVERED";

/**
 * Text message content
 */
export interface TextContent {
  text: string;
}

/**
 * Image message content
 */
export interface ImageContent {
  uri: string;
  thumbnailUri?: string;
  width?: number;
  height?: number;
  caption?: string;
}

/**
 * Document message content
 */
export interface DocumentContent {
  uri: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType?: string;
}

/**
 * System message content
 */
export interface SystemContent {
  event: SystemMessageEvent;
  text: string;
  metadata?: {
    userId?: string;
    userName?: string;
    amount?: string;
    [key: string]: any;
  };
}

/**
 * Union type for all message content types
 */
export type MessageContent =
  | TextContent
  | ImageContent
  | DocumentContent
  | SystemContent;

/**
 * Core Message model
 */
export interface Message {
  id: string;
  conversationId: string;
  exchangeSessionId?: string; // Optional but preferred for context
  senderId: string; // User ID or 'SYSTEM' for system messages
  type: MessageType;
  content: MessageContent;
  status: MessageStatus;
  createdAt: string;
  deliveredAt?: string;
  seenAt?: string;
  // Legacy support
  isRead?: boolean;
}

/**
 * Type guards for message content
 */
export function isTextMessage(
  message: Message,
): message is Message & { content: TextContent } {
  return message.type === "TEXT";
}

export function isImageMessage(
  message: Message,
): message is Message & { content: ImageContent } {
  return message.type === "IMAGE";
}

export function isDocumentMessage(
  message: Message,
): message is Message & { content: DocumentContent } {
  return message.type === "DOCUMENT";
}

export function isSystemMessage(
  message: Message,
): message is Message & { content: SystemContent } {
  return message.type === "SYSTEM";
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

/**
 * Exchange context attached to a conversation
 */
export interface ConversationExchangeContext {
  exchangeId: string;
  type: ExchangeType;
  status: ExchangeStatus;
  isReadOnly: boolean; // True when COMPLETED or CANCELLED
}

/**
 * Conversation model
 */
export interface Conversation {
  id: string;
  participants: User[];
  exchangeContext?: ConversationExchangeContext;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TYPING INDICATOR TYPES
// ============================================================================

/**
 * Typing state for a user in a conversation
 */
export interface TypingState {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

// ============================================================================
// ATTACHMENT TYPES
// ============================================================================

/**
 * Attachment types for the picker
 */
export type AttachmentType = "IMAGE" | "DOCUMENT";

/**
 * Pending attachment before sending
 */
export interface PendingAttachment {
  type: AttachmentType;
  uri: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable text for system message events
 */
export function getSystemMessageText(
  event: SystemMessageEvent,
  userName?: string,
): string {
  const messages: Record<SystemMessageEvent, string> = {
    EXCHANGE_REQUEST_SENT: "Exchange request sent",
    EXCHANGE_ACCEPTED: "Exchange accepted",
    EXCHANGE_DECLINED: "Exchange declined",
    EXCHANGE_CANCELLED: "Exchange cancelled",
    USER_MARKED_SENT: userName
      ? `${userName} marked as sent`
      : "Marked as sent",
    USER_CONFIRMED_RECEIPT: userName
      ? `${userName} confirmed receipt`
      : "Receipt confirmed",
    EXCHANGE_COMPLETED: "Exchange completed! 🎉",
    EXCHANGE_IN_TRANSIT: "Package is in transit",
    EXCHANGE_DELIVERED: "Package delivered",
  };
  return messages[event] || event;
}

/**
 * Create a system message
 */
export function createSystemMessage(
  conversationId: string,
  event: SystemMessageEvent,
  metadata?: SystemContent["metadata"],
): Message {
  const text = getSystemMessageText(event, metadata?.userName);
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    senderId: "SYSTEM",
    type: "SYSTEM",
    content: { event, text, metadata },
    status: "DELIVERED",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a text message
 */
export function createTextMessage(
  conversationId: string,
  senderId: string,
  text: string,
  exchangeSessionId?: string,
): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    exchangeSessionId,
    senderId,
    type: "TEXT",
    content: { text },
    status: "SENDING",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create an image message
 */
export function createImageMessage(
  conversationId: string,
  senderId: string,
  imageData: Omit<ImageContent, "thumbnailUri">,
  exchangeSessionId?: string,
): Message {
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    exchangeSessionId,
    senderId,
    type: "IMAGE",
    content: { ...imageData, thumbnailUri: imageData.uri },
    status: "SENDING",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a document message
 */
export function createDocumentMessage(
  conversationId: string,
  senderId: string,
  documentData: DocumentContent,
  exchangeSessionId?: string,
): Message {
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    exchangeSessionId,
    senderId,
    type: "DOCUMENT",
    content: documentData,
    status: "SENDING",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if a conversation is read-only based on exchange status
 */
export function isConversationReadOnly(status?: ExchangeStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(mimeType?: string): string {
  if (!mimeType) return "document-outline";
  if (mimeType.startsWith("image/")) return "image-outline";
  if (mimeType.startsWith("video/")) return "videocam-outline";
  if (mimeType.includes("pdf")) return "document-text-outline";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document-outline";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "grid-outline";
  return "document-outline";
}
