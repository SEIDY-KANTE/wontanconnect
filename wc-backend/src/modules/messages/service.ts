import { messageRepository, ConversationWithDetails, MessageWithSender } from './repository.js';
import { sessionRepository } from '../sessions/repository.js';
import { auditService } from '../audit/service.js';
import { AUDIT_ACTIONS } from '../../shared/constants.js';
import { Errors } from '../../shared/errors.js';
import { calculatePagination, PaginationMeta } from '../../shared/pagination.js';
import { broadcastNewMessage, broadcastMessageRead } from '../websocket/index.js';
import type {
  CreateMessageInput,
  MessageFiltersInput,
  ConversationFiltersInput,
} from './schemas.js';
import { MessageType } from '@prisma/client';

class MessageService {
  async listConversations(
    userId: string,
    filters: ConversationFiltersInput
  ): Promise<{ conversations: ConversationWithDetails[]; pagination: PaginationMeta }> {
    const { conversations, total } = await messageRepository.findUserConversations(userId, filters);
    const pagination = calculatePagination(filters.page, filters.limit, total);

    return { conversations, pagination };
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationWithDetails> {
    const conversation = await messageRepository.findConversationById(conversationId);

    if (!conversation) {
      throw Errors.notFound('Conversation');
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some((p) => p.id === userId);
    if (!isParticipant) {
      throw Errors.forbidden('You are not a participant in this conversation');
    }

    return conversation;
  }

  async getOrCreateConversationBySession(
    userId: string,
    sessionId: string
  ): Promise<ConversationWithDetails> {
    // Verify user is part of the session
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw Errors.notFound('Session');
    }

    if (session.initiatorId !== userId && session.responderId !== userId) {
      throw Errors.forbidden('You are not a participant in this session');
    }

    // Get or create conversation
    const conversation = await messageRepository.findOrCreateConversation(sessionId);
    return (await messageRepository.findConversationById(conversation.id))!;
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    input: CreateMessageInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<MessageWithSender> {
    // Check if user is participant
    const isParticipant = await messageRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw Errors.forbidden('You are not a participant in this conversation');
    }

    const message = await messageRepository.createMessage(
      conversationId,
      userId,
      input.content,
      input.type as MessageType,
      input.metadata
    );

    // Broadcast to other participants via WebSocket
    try {
      const conversation = await messageRepository.findConversationById(conversationId);
      if (conversation) {
        const participantIds = conversation.participants.map((p) => p.id);
        broadcastNewMessage(conversationId, participantIds, {
          id: message.id,
          conversationId,
          senderId: userId,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt.toISOString(),
        });
      }
    } catch (error) {
      // Non-blocking - don't fail the message send if broadcast fails
      console.error('WebSocket broadcast error:', error);
    }

    // Audit log (async, non-blocking)
    auditService
      .log({
        action: AUDIT_ACTIONS.MESSAGE_SEND,
        actorId: userId,
        entityType: 'message',
        entityId: message.id,
        newValues: { conversationId, type: input.type },
        ipAddress,
        userAgent,
      })
      .catch(() => {});

    return message;
  }

  async getMessages(
    userId: string,
    conversationId: string,
    filters: MessageFiltersInput
  ): Promise<{ messages: MessageWithSender[]; pagination: PaginationMeta }> {
    // Check if user is participant
    const isParticipant = await messageRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw Errors.forbidden('You are not a participant in this conversation');
    }

    const { messages, total } = await messageRepository.findMessages(conversationId, filters);
    const pagination = calculatePagination(filters.page, filters.limit, total);

    return { messages: messages.reverse(), pagination }; // Oldest first for display
  }

  async markAsRead(userId: string, conversationId: string): Promise<{ markedCount: number }> {
    // Check if user is participant
    const isParticipant = await messageRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw Errors.forbidden('You are not a participant in this conversation');
    }

    const markedCount = await messageRepository.markAsRead(conversationId, userId);

    // Broadcast read receipt via WebSocket
    if (markedCount > 0) {
      try {
        const conversation = await messageRepository.findConversationById(conversationId);
        if (conversation) {
          const participantIds = conversation.participants.map((p) => p.id);
          broadcastMessageRead(conversationId, participantIds, {
            conversationId,
            messageIds: [], // Could track specific message IDs if needed
            readBy: userId,
            readAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        // Non-blocking
        console.error('WebSocket broadcast error:', error);
      }
    }

    return { markedCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return messageRepository.getUnreadCount(userId);
  }
}

export const messageService = new MessageService();
