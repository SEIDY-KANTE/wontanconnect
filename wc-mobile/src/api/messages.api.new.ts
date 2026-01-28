/**
 * Messages API (Production-Ready)
 *
 * Complete messages module with proper adapters, NO mock fallbacks.
 *
 * CRITICAL CHANGES:
 * - Uses adaptBackendConversation/Message for format alignment
 * - Proper error propagation (no silent failures)
 * - Unread count from separate endpoint
 * - Attachment support via metadata
 */

import { apiClient } from "./client";
import { handleApiError } from "./errorHandling";
import {
  adaptBackendPagination,
  type MobilePaginationMeta,
} from "./contracts/pagination";
import {
  adaptBackendConversation,
  adaptBackendConversations,
  adaptBackendMessage,
  adaptBackendMessages,
  adaptSendMessageRequest,
  adaptUnreadCount,
  type MobileConversation,
  type MobileMessage,
  type MobileSendMessageRequest,
} from "./contracts/messages.adapter";
import { debugLog, errorLog } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface MessageFilters {
  page?: number;
  limit?: number;
  before?: string; // ISO datetime
  after?: string; // ISO datetime
}

export interface ConversationsListResponse {
  conversations: MobileConversation[];
  meta: MobilePaginationMeta;
}

export interface MessagesListResponse {
  messages: MobileMessage[];
  meta: MobilePaginationMeta;
}

// ============================================================================
// CONVERSATION ENDPOINTS
// ============================================================================

/**
 * List all conversations for the current user
 */
export async function listConversations(
  filters?: ConversationFilters,
): Promise<ConversationsListResponse> {
  debugLog("MessagesAPI", "Listing conversations", filters);

  try {
    const response = await apiClient.get("/conversations", {
      params: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        unreadOnly: filters?.unreadOnly ? "true" : undefined,
      },
    });

    const conversations = adaptBackendConversations(response.data.data);
    const meta = adaptBackendPagination(response.data.pagination);

    debugLog("MessagesAPI", `Loaded ${conversations.length} conversations`);

    return { conversations, meta };
  } catch (error) {
    errorLog("MessagesAPI", error, "listConversations");
    throw handleApiError(error);
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(
  conversationId: string,
): Promise<MobileConversation> {
  debugLog("MessagesAPI", "Getting conversation", conversationId);

  try {
    const response = await apiClient.get(`/conversations/${conversationId}`);

    const conversation = adaptBackendConversation(response.data.data);

    return conversation;
  } catch (error) {
    errorLog("MessagesAPI", error, `getConversation(${conversationId})`);
    throw handleApiError(error);
  }
}

/**
 * Get unread message count (separate endpoint per backend design)
 */
export async function getUnreadMessageCount(): Promise<number> {
  debugLog("MessagesAPI", "Getting unread count");

  try {
    const response = await apiClient.get("/conversations/unread-count");

    return adaptUnreadCount(response.data.data);
  } catch (error) {
    errorLog("MessagesAPI", error, "getUnreadMessageCount");
    throw handleApiError(error);
  }
}

// ============================================================================
// MESSAGE ENDPOINTS
// ============================================================================

/**
 * List messages in a conversation
 */
export async function listMessages(
  conversationId: string,
  filters?: MessageFilters,
): Promise<MessagesListResponse> {
  debugLog("MessagesAPI", "Listing messages", { conversationId, ...filters });

  try {
    const response = await apiClient.get(
      `/conversations/${conversationId}/messages`,
      {
        params: {
          page: filters?.page || 1,
          limit: filters?.limit || 50, // More messages per page for chat
          before: filters?.before,
          after: filters?.after,
        },
      },
    );

    const messages = adaptBackendMessages(response.data.data);
    const meta = adaptBackendPagination(response.data.pagination);

    debugLog("MessagesAPI", `Loaded ${messages.length} messages`);

    return { messages, meta };
  } catch (error) {
    errorLog("MessagesAPI", error, `listMessages(${conversationId})`);
    throw handleApiError(error);
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  message: MobileSendMessageRequest,
): Promise<MobileMessage> {
  debugLog("MessagesAPI", "Sending message", {
    conversationId,
    type: message.type,
  });

  try {
    const backendRequest = adaptSendMessageRequest(message);

    const response = await apiClient.post(
      `/conversations/${conversationId}/messages`,
      backendRequest,
    );

    const sentMessage = adaptBackendMessage(response.data.data);

    debugLog("MessagesAPI", "Message sent", sentMessage.id);

    return sentMessage;
  } catch (error) {
    errorLog("MessagesAPI", error, `sendMessage(${conversationId})`);
    throw handleApiError(error);
  }
}

/**
 * Send a text message (convenience wrapper)
 */
export async function sendTextMessage(
  conversationId: string,
  content: string,
): Promise<MobileMessage> {
  return sendMessage(conversationId, { content, type: "text" });
}

/**
 * Send a message with attachments
 */
export async function sendMessageWithAttachments(
  conversationId: string,
  content: string,
  attachmentUrls: Array<{
    url: string;
    type: "image" | "document";
    filename: string;
  }>,
): Promise<MobileMessage> {
  return sendMessage(conversationId, {
    content,
    type: attachmentUrls.some((a) => a.type === "image") ? "image" : "text",
    attachments: attachmentUrls,
  });
}

/**
 * Mark a conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
): Promise<void> {
  debugLog("MessagesAPI", "Marking conversation as read", conversationId);

  try {
    await apiClient.post(`/conversations/${conversationId}/read`);
    debugLog("MessagesAPI", "Conversation marked as read");
  } catch (error) {
    errorLog("MessagesAPI", error, `markConversationAsRead(${conversationId})`);
    throw handleApiError(error);
  }
}

// ============================================================================
// REAL-TIME HELPERS
// ============================================================================

/**
 * Prepend a new message to a list (for real-time updates)
 */
export function prependMessage(
  messages: MobileMessage[],
  newMessage: MobileMessage,
): MobileMessage[] {
  // Check for duplicates
  if (messages.some((m) => m.id === newMessage.id)) {
    return messages;
  }
  return [newMessage, ...messages];
}

/**
 * Update message status in a list
 */
export function updateMessageStatus(
  messages: MobileMessage[],
  messageId: string,
  status: "sent" | "delivered" | "read",
): MobileMessage[] {
  return messages.map((m) => (m.id === messageId ? { ...m, status } : m));
}

/**
 * Update conversation with new last message
 */
export function updateConversationWithMessage(
  conversations: MobileConversation[],
  conversationId: string,
  message: MobileMessage,
): MobileConversation[] {
  return conversations.map((c) => {
    if (c.conversationId !== conversationId) return c;

    return {
      ...c,
      lastMessage: {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        timestamp: message.timestamp,
      },
      messageCount: c.messageCount + 1,
      updatedAt: new Date(),
    };
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  MobileConversation,
  MobileMessage,
  MobileSendMessageRequest,
  MobileParticipant,
  MobileMessageAttachment,
} from "./contracts/messages.adapter";
