/**
 * Messages Store (Zustand)
 *
 * Global messaging state management.
 * Handles messages, conversations, typing indicators, and seen states.
 *
 * Supports both API mode and mock fallback.
 */

import { create } from "zustand";
import {
  Message,
  Conversation,
  TypingState,
  MessageStatus,
  SystemMessageEvent,
  SystemContent,
  createSystemMessage,
  createTextMessage,
  createImageMessage,
  createDocumentMessage,
  ImageContent,
  DocumentContent,
  isConversationReadOnly,
} from "../model/types";
import { mockConversations, currentUser } from "../data/mockData";
import { ExchangeStatus } from "@/features/exchange/model/types";
import {
  listConversations as apiListConversations,
  listMessages as apiListMessages,
  sendMessage as apiSendMessage,
  markConversationRead as apiMarkConversationRead,
  USE_API,
} from "@/api";

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPING_TIMEOUT = 3000; // ms before typing indicator auto-hides
const MESSAGE_DELIVERY_DELAY = 500; // ms to simulate delivery

// ============================================================================
// API MAPPING
// ============================================================================

/**
 * Map backend API conversation to frontend Conversation model.
 */
function mapApiToConversation(apiConv: any): Conversation {
  return {
    id: apiConv.id,
    participants:
      apiConv.participants?.map((p: any) => ({
        id: p.id,
        name: p.displayName || "Unknown",
        avatar: p.avatarUrl || undefined,
      })) || [],
    lastMessage: apiConv.lastMessage
      ? {
          id: apiConv.lastMessage.id,
          conversationId: apiConv.id,
          senderId: apiConv.lastMessage.senderId,
          type: (apiConv.lastMessage.type?.toUpperCase() ||
            "TEXT") as Message["type"],
          content: { text: apiConv.lastMessage.content || "" },
          status: "DELIVERED" as MessageStatus,
          createdAt: apiConv.lastMessage.createdAt,
        }
      : undefined,
    unreadCount: apiConv.unreadCount || 0,
    createdAt: apiConv.createdAt || new Date().toISOString(),
    updatedAt: apiConv.updatedAt || new Date().toISOString(),
    exchangeContext: apiConv.session
      ? {
          exchangeId: apiConv.session.id,
          type: apiConv.session.offer?.type === "shipping" ? "SHIPPING" : "FX",
          status: mapApiStatusToExchangeStatus(apiConv.session.status),
          isReadOnly: ["completed", "cancelled", "declined"].includes(
            apiConv.session.status,
          ),
        }
      : undefined,
  };
}

/**
 * Map backend API message to frontend Message model.
 */
function mapApiToMessage(apiMsg: any): Message {
  const type = (apiMsg.type?.toUpperCase() || "TEXT") as Message["type"];

  let content: Message["content"];
  if (type === "TEXT") {
    content = { text: apiMsg.content || "" };
  } else if (type === "SYSTEM") {
    content = { event: "EXCHANGE_REQUEST_SENT", text: apiMsg.content || "" };
  } else if (type === "IMAGE") {
    content = {
      uri: apiMsg.metadata?.uri || "",
      thumbnailUri: apiMsg.metadata?.thumbnailUri,
    };
  } else {
    content = { text: apiMsg.content || "" };
  }

  return {
    id: apiMsg.id,
    conversationId: apiMsg.conversationId,
    senderId: apiMsg.senderId,
    type,
    content,
    status: apiMsg.readAt ? "SEEN" : "DELIVERED",
    createdAt: apiMsg.createdAt,
    exchangeSessionId: apiMsg.sessionId,
  };
}

/**
 * Map backend status to frontend ExchangeStatus
 */
function mapApiStatusToExchangeStatus(status: string): ExchangeStatus {
  const statusMap: Record<string, ExchangeStatus> = {
    pending: "PENDING_APPROVAL",
    accepted: "IN_PROGRESS",
    in_progress: "IN_PROGRESS",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
    declined: "CANCELLED",
  };
  return statusMap[status] || "PENDING_APPROVAL";
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface MessagesState {
  // Core data
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;

  // Typing states
  typingStates: Record<string, TypingState>;

  // Active conversation
  activeConversationId: string | null;

  // Loading states
  isLoading: boolean;
  isSending: boolean;

  // Actions - Conversations
  loadConversations: () => void;
  getConversation: (conversationId: string) => Conversation | undefined;
  updateConversationExchangeContext: (
    conversationId: string,
    exchangeId: string,
    type: "FX" | "SHIPPING",
    status: ExchangeStatus,
  ) => void;
  setActiveConversation: (conversationId: string | null) => void;
  markConversationAsRead: (conversationId: string) => void;

  // Actions - Messages
  loadMessages: (conversationId: string) => void;
  getMessages: (conversationId: string) => Message[];
  sendTextMessage: (
    conversationId: string,
    text: string,
    exchangeSessionId?: string,
  ) => void;
  sendImageMessage: (
    conversationId: string,
    imageData: Omit<ImageContent, "thumbnailUri">,
    exchangeSessionId?: string,
  ) => void;
  sendDocumentMessage: (
    conversationId: string,
    documentData: DocumentContent,
    exchangeSessionId?: string,
  ) => void;
  addSystemMessage: (
    conversationId: string,
    event: SystemMessageEvent,
    metadata?: SystemContent["metadata"],
  ) => void;
  updateMessageStatus: (
    messageId: string,
    conversationId: string,
    status: MessageStatus,
  ) => void;
  markMessagesAsSeen: (conversationId: string) => void;

  // Actions - Typing
  setTyping: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;
  isUserTyping: (conversationId: string, userId: string) => boolean;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;

  // Actions - Read-only state
  isConversationLocked: (conversationId: string) => boolean;

  // Actions - WebSocket handlers
  handleIncomingMessage: (payload: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
  }) => void;
  handleMessageRead: (payload: {
    conversationId: string;
    messageIds: string[];
    readBy: string;
    readAt: string;
  }) => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useMessagesStore = create<MessagesState>((set, get) => ({
  // Initial state
  conversations: [],
  messagesByConversation: {},
  typingStates: {},
  activeConversationId: null,
  isLoading: false,
  isSending: false,

  // =========================================================================
  // CONVERSATION ACTIONS
  // =========================================================================

  loadConversations: async () => {
    set({ isLoading: true });

    try {
      if (!USE_API) {
        // Mock mode
        setTimeout(() => {
          const conversations: Conversation[] = mockConversations.map(
            (conv) => ({
              ...conv,
              lastMessage: conv.lastMessage
                ? {
                    id: conv.lastMessage.id,
                    conversationId: conv.lastMessage.conversationId,
                    senderId: conv.lastMessage.senderId,
                    type: "TEXT" as const,
                    content: { text: String(conv.lastMessage.content || "") },
                    status: conv.lastMessage.isRead
                      ? ("SEEN" as const)
                      : ("DELIVERED" as const),
                    createdAt: conv.lastMessage.createdAt,
                  }
                : undefined,
            }),
          );
          set({ conversations, isLoading: false });
        }, 300);
        return;
      }

      // API mode
      console.log("[MessagesStore] Loading conversations from API...");
      const { conversations: apiConversations } = await apiListConversations();
      const conversations = apiConversations.map(mapApiToConversation);
      console.log(
        "[MessagesStore] Loaded",
        conversations.length,
        "conversations",
      );
      set({ conversations, isLoading: false });
    } catch (error: any) {
      console.error("[MessagesStore] Failed to load conversations:", error);
      // Fallback to mock data
      const conversations: Conversation[] = mockConversations.map((conv) => ({
        ...conv,
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage.id,
              conversationId: conv.lastMessage.conversationId,
              senderId: conv.lastMessage.senderId,
              type: "TEXT" as const,
              content: { text: String(conv.lastMessage.content || "") },
              status: conv.lastMessage.isRead
                ? ("SEEN" as const)
                : ("DELIVERED" as const),
              createdAt: conv.lastMessage.createdAt,
            }
          : undefined,
      }));
      set({ conversations, isLoading: false });
    }
  },

  getConversation: (conversationId: string) => {
    return get().conversations.find((c) => c.id === conversationId);
  },

  updateConversationExchangeContext: (
    conversationId,
    exchangeId,
    type,
    status,
  ) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              exchangeContext: {
                exchangeId,
                type,
                status,
                isReadOnly: isConversationReadOnly(status),
              },
            }
          : conv,
      ),
    }));
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      // Load messages and mark as read when opening conversation
      get().loadMessages(conversationId);
      get().markConversationAsRead(conversationId);
    }
  },

  markConversationAsRead: async (conversationId) => {
    // Validate conversation ID before making API call
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!conversationId || !uuidRegex.test(conversationId)) {
      console.warn(
        "[MessagesStore] Invalid conversation ID, skipping markAsRead:",
        conversationId,
      );
      return;
    }

    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
      ),
    }));
    get().markMessagesAsSeen(conversationId);

    // Call API to mark as read
    if (USE_API) {
      try {
        await apiMarkConversationRead(conversationId);
        console.log(
          "[MessagesStore] Marked conversation as read:",
          conversationId,
        );
      } catch (error) {
        console.error(
          "[MessagesStore] Failed to mark conversation as read:",
          error,
        );
      }
    }
  },

  // =========================================================================
  // MESSAGE ACTIONS
  // =========================================================================

  loadMessages: async (conversationId: string) => {
    // Validate conversation ID - must be a valid UUID, not a fake conv- prefixed ID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!conversationId || !uuidRegex.test(conversationId)) {
      console.warn(
        "[MessagesStore] Invalid conversation ID, skipping load:",
        conversationId,
      );
      return;
    }

    const state = get();
    if (state.messagesByConversation[conversationId]) {
      return; // Already loaded
    }

    set({ isLoading: true });

    try {
      if (!USE_API) {
        // Mock mode - generate mock messages
        setTimeout(() => {
          const baseMessages: Message[] = [
            {
              id: `${conversationId}-m1`,
              conversationId,
              senderId: "current-user",
              type: "TEXT",
              content: {
                text: "Hello! I saw your offer. Is it still available?",
              },
              status: "SEEN",
              createdAt: "2026-01-18T09:00:00Z",
            },
            {
              id: `${conversationId}-m2`,
              conversationId,
              senderId: conversationId.replace("conv-", ""),
              type: "TEXT",
              content: {
                text: "Hi! Yes, still available. What amount are you interested in?",
              },
              status: "SEEN",
              createdAt: "2026-01-18T09:15:00Z",
            },
            {
              id: `${conversationId}-m3`,
              conversationId,
              senderId: "current-user",
              type: "TEXT",
              content: { text: "Great! I'd like to exchange €500." },
              status: "SEEN",
              createdAt: "2026-01-18T09:30:00Z",
            },
            {
              id: `${conversationId}-m4`,
              conversationId,
              senderId: conversationId.replace("conv-", ""),
              type: "TEXT",
              content: {
                text: "Perfect! For €500, I can offer 1€ = 10,500 GNF. That's 5,250,000 GNF total.",
              },
              status: "SEEN",
              createdAt: "2026-01-18T10:00:00Z",
            },
          ];

          set((state) => ({
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: baseMessages,
            },
            isLoading: false,
          }));
        }, 300);
        return;
      }

      // API mode
      console.log("[MessagesStore] Loading messages for:", conversationId);
      const { messages: apiMessages } = await apiListMessages(conversationId);
      const messages = apiMessages.map(mapApiToMessage);
      console.log("[MessagesStore] Loaded", messages.length, "messages");

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("[MessagesStore] Failed to load messages:", error);
      // Set empty array on error
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [],
        },
        isLoading: false,
      }));
    }
  },

  getMessages: (conversationId: string) => {
    return get().messagesByConversation[conversationId] || [];
  },

  sendTextMessage: async (conversationId, text, exchangeSessionId) => {
    // Validate conversation ID before sending
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!conversationId || !uuidRegex.test(conversationId)) {
      console.error(
        "[MessagesStore] Cannot send message - invalid conversation ID:",
        conversationId,
      );
      return;
    }

    // Create optimistic message
    const message = createTextMessage(
      conversationId,
      currentUser.id,
      text,
      exchangeSessionId,
    );

    // Add message immediately (optimistic)
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] || []),
          message,
        ],
      },
      isSending: true,
    }));

    // Update conversation last message
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: message,
              updatedAt: new Date().toISOString(),
            }
          : conv,
      ),
    }));

    // Stop typing indicator
    get().stopTyping(conversationId);

    try {
      if (USE_API) {
        // API mode - actually send the message
        console.log("[MessagesStore] Sending message via API...");
        const sentMessage = await apiSendMessage(conversationId, text);
        console.log("[MessagesStore] Message sent:", sentMessage.id);

        // Update the optimistic message with real ID
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]:
              state.messagesByConversation[conversationId]?.map((m) =>
                m.id === message.id
                  ? {
                      ...m,
                      id: sentMessage.id,
                      status: "DELIVERED" as MessageStatus,
                    }
                  : m,
              ) || [],
          },
          isSending: false,
        }));
      } else {
        // Mock mode - simulate delivery
        setTimeout(() => {
          get().updateMessageStatus(message.id, conversationId, "SENT");
        }, MESSAGE_DELIVERY_DELAY / 2);

        setTimeout(() => {
          get().updateMessageStatus(message.id, conversationId, "DELIVERED");
          set({ isSending: false });
        }, MESSAGE_DELIVERY_DELAY);
      }
    } catch (error: any) {
      console.error("[MessagesStore] Failed to send message:", error);
      // Mark message as failed
      get().updateMessageStatus(message.id, conversationId, "SENDING");
      set({ isSending: false });
    }
  },

  sendImageMessage: (conversationId, imageData, exchangeSessionId) => {
    const message = createImageMessage(
      conversationId,
      currentUser.id,
      imageData,
      exchangeSessionId,
    );

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] || []),
          message,
        ],
      },
      isSending: true,
    }));

    setTimeout(() => {
      get().updateMessageStatus(message.id, conversationId, "SENT");
    }, MESSAGE_DELIVERY_DELAY / 2);

    setTimeout(() => {
      get().updateMessageStatus(message.id, conversationId, "DELIVERED");
      set({ isSending: false });
    }, MESSAGE_DELIVERY_DELAY);
  },

  sendDocumentMessage: (conversationId, documentData, exchangeSessionId) => {
    const message = createDocumentMessage(
      conversationId,
      currentUser.id,
      documentData,
      exchangeSessionId,
    );

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] || []),
          message,
        ],
      },
      isSending: true,
    }));

    setTimeout(() => {
      get().updateMessageStatus(message.id, conversationId, "SENT");
    }, MESSAGE_DELIVERY_DELAY / 2);

    setTimeout(() => {
      get().updateMessageStatus(message.id, conversationId, "DELIVERED");
      set({ isSending: false });
    }, MESSAGE_DELIVERY_DELAY);
  },

  addSystemMessage: (conversationId, event, metadata) => {
    const message = createSystemMessage(conversationId, event, metadata);

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] || []),
          message,
        ],
      },
    }));
  },

  updateMessageStatus: (messageId, conversationId, status) => {
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (
          state.messagesByConversation[conversationId] || []
        ).map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status,
                ...(status === "DELIVERED"
                  ? { deliveredAt: new Date().toISOString() }
                  : {}),
                ...(status === "SEEN"
                  ? { seenAt: new Date().toISOString() }
                  : {}),
              }
            : msg,
        ),
      },
    }));
  },

  markMessagesAsSeen: (conversationId) => {
    const currentUserId = currentUser.id;

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (
          state.messagesByConversation[conversationId] || []
        ).map((msg) =>
          // Mark messages from others as seen
          msg.senderId !== currentUserId && msg.status !== "SEEN"
            ? {
                ...msg,
                status: "SEEN" as const,
                seenAt: new Date().toISOString(),
              }
            : msg,
        ),
      },
    }));
  },

  // =========================================================================
  // TYPING ACTIONS
  // =========================================================================

  setTyping: (conversationId, userId, isTyping) => {
    set((state) => ({
      typingStates: {
        ...state.typingStates,
        [`${conversationId}-${userId}`]: {
          conversationId,
          userId,
          isTyping,
          timestamp: Date.now(),
        },
      },
    }));

    // Auto-clear typing after timeout
    if (isTyping) {
      setTimeout(() => {
        const state = get();
        const key = `${conversationId}-${userId}`;
        const typingState = state.typingStates[key];
        if (
          typingState &&
          Date.now() - typingState.timestamp >= TYPING_TIMEOUT
        ) {
          get().setTyping(conversationId, userId, false);
        }
      }, TYPING_TIMEOUT);
    }
  },

  isUserTyping: (conversationId, userId) => {
    const key = `${conversationId}-${userId}`;
    const typingState = get().typingStates[key];
    return (
      typingState?.isTyping &&
      Date.now() - typingState.timestamp < TYPING_TIMEOUT
    );
  },

  startTyping: (conversationId) => {
    get().setTyping(conversationId, currentUser.id, true);
  },

  stopTyping: (conversationId) => {
    get().setTyping(conversationId, currentUser.id, false);
  },

  // =========================================================================
  // READ-ONLY STATE
  // =========================================================================

  isConversationLocked: (conversationId) => {
    const conversation = get().getConversation(conversationId);
    return conversation?.exchangeContext?.isReadOnly ?? false;
  },

  // =========================================================================
  // WEBSOCKET HANDLERS
  // =========================================================================

  handleIncomingMessage: (payload) => {
    console.log("[MessagesStore] Received incoming message:", payload.id);

    // Don't add if it's our own message (already added optimistically)
    if (payload.senderId === currentUser.id) {
      console.log("[MessagesStore] Ignoring own message");
      return;
    }

    // Map the WebSocket payload to a Message object
    const message: Message = {
      id: payload.id,
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      type: (payload.type?.toUpperCase() || "TEXT") as Message["type"],
      content: { text: payload.content || "" },
      status: "DELIVERED",
      createdAt: payload.createdAt,
    };

    // Add message to the conversation
    set((state) => {
      const existingMessages =
        state.messagesByConversation[payload.conversationId] || [];

      // Check if message already exists
      if (existingMessages.some((m) => m.id === payload.id)) {
        console.log("[MessagesStore] Message already exists, skipping");
        return state;
      }

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [payload.conversationId]: [...existingMessages, message],
        },
      };
    });

    // Update conversation last message and increment unread if not active
    set((state) => {
      const isActive = state.activeConversationId === payload.conversationId;
      return {
        conversations: state.conversations.map((conv) =>
          conv.id === payload.conversationId
            ? {
                ...conv,
                lastMessage: message,
                updatedAt: new Date().toISOString(),
                unreadCount: isActive ? conv.unreadCount : conv.unreadCount + 1,
              }
            : conv,
        ),
      };
    });
  },

  handleMessageRead: (payload) => {
    console.log("[MessagesStore] Messages marked as read:", payload.messageIds);

    // Update message statuses to SEEN
    set((state) => {
      const messages = state.messagesByConversation[payload.conversationId];
      if (!messages) return state;

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [payload.conversationId]: messages.map((m) =>
            payload.messageIds.includes(m.id)
              ? { ...m, status: "SEEN" as MessageStatus }
              : m,
          ),
        },
      };
    });
  },
}));

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get messages for a conversation
 */
export function useConversationMessages(conversationId: string) {
  const messages = useMessagesStore(
    (state) => state.messagesByConversation[conversationId] || [],
  );
  const loadMessages = useMessagesStore((state) => state.loadMessages);
  const isLoading = useMessagesStore((state) => state.isLoading);

  return {
    messages,
    loadMessages: () => loadMessages(conversationId),
    isLoading,
  };
}

/**
 * Hook for typing indicator
 */
export function useTypingIndicator(
  conversationId: string,
  otherUserId: string,
) {
  const isTyping = useMessagesStore((state) =>
    state.isUserTyping(conversationId, otherUserId),
  );
  const startTyping = useMessagesStore((state) => state.startTyping);
  const stopTyping = useMessagesStore((state) => state.stopTyping);

  return {
    isOtherUserTyping: isTyping,
    startTyping: () => startTyping(conversationId),
    stopTyping: () => stopTyping(conversationId),
  };
}

/**
 * Hook for conversation read-only state
 */
export function useConversationReadOnly(conversationId: string) {
  const isLocked = useMessagesStore((state) =>
    state.isConversationLocked(conversationId),
  );
  const conversation = useMessagesStore((state) =>
    state.getConversation(conversationId),
  );

  return {
    isReadOnly: isLocked,
    exchangeStatus: conversation?.exchangeContext?.status,
  };
}
