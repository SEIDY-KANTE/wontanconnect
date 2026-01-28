/**
 * Messages API
 *
 * API endpoints for conversations and messages.
 */

import { apiClient } from "./client";
import { MESSAGES_ENDPOINTS } from "./endpoints";
import type {
  ApiResponse,
  Conversation,
  Message,
  SendMessageRequest,
  PaginationParams,
} from "./types";

// ============================================================================
// MESSAGES API FUNCTIONS
// ============================================================================

/**
 * List all conversations for the current user.
 */
export async function listConversations(
  params?: PaginationParams,
): Promise<{ conversations: Conversation[]; total: number }> {
  try {
    console.log("[MessagesAPI] Listing conversations");

    const response = await apiClient.get<
      ApiResponse<Conversation[]> & { meta: { total: number } }
    >(MESSAGES_ENDPOINTS.CONVERSATIONS, { params });

    const { data, meta } = response.data;

    console.log("[MessagesAPI] Fetched", data.length, "conversations");
    return {
      conversations: data,
      total: meta.total,
    };
  } catch (error) {
    console.error("[MessagesAPI] Failed to list conversations:", error);
    throw error;
  }
}

/**
 * Get a single conversation by ID.
 */
export async function getConversation(id: string): Promise<Conversation> {
  try {
    console.log("[MessagesAPI] Fetching conversation:", id);

    const response = await apiClient.get<ApiResponse<Conversation>>(
      MESSAGES_ENDPOINTS.CONVERSATION(id),
    );

    console.log("[MessagesAPI] Conversation fetched:", id);
    return response.data.data;
  } catch (error) {
    console.error("[MessagesAPI] Failed to fetch conversation:", error);
    throw error;
  }
}

/**
 * List messages in a conversation.
 */
export async function listMessages(
  conversationId: string,
  params?: PaginationParams,
): Promise<{ messages: Message[]; total: number }> {
  try {
    console.log(
      "[MessagesAPI] Listing messages for conversation:",
      conversationId,
    );

    const response = await apiClient.get<
      ApiResponse<Message[]> & { meta: { total: number } }
    >(MESSAGES_ENDPOINTS.MESSAGES(conversationId), { params });

    const { data, meta } = response.data;

    console.log("[MessagesAPI] Fetched", data.length, "messages");
    return {
      messages: data,
      total: meta.total,
    };
  } catch (error) {
    console.error("[MessagesAPI] Failed to list messages:", error);
    throw error;
  }
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<Message> {
  try {
    console.log(
      "[MessagesAPI] Sending message to conversation:",
      conversationId,
    );

    const response = await apiClient.post<ApiResponse<Message>>(
      MESSAGES_ENDPOINTS.MESSAGES(conversationId),
      { content } as SendMessageRequest,
    );

    console.log("[MessagesAPI] Message sent:", response.data.data.id);
    return response.data.data;
  } catch (error) {
    console.error("[MessagesAPI] Failed to send message:", error);
    throw error;
  }
}

/**
 * Mark conversation as read.
 */
export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  try {
    console.log("[MessagesAPI] Marking conversation as read:", conversationId);

    await apiClient.patch(MESSAGES_ENDPOINTS.MARK_READ(conversationId));

    console.log("[MessagesAPI] Conversation marked as read");
  } catch (error) {
    console.error("[MessagesAPI] Failed to mark conversation as read:", error);
    throw error;
  }
}
