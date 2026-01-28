import { prisma } from '../../config/database.js';
import { Conversation, Message, MessageType, MessageStatus, Prisma } from '@prisma/client';
import { getPaginationParams } from '../../shared/pagination.js';
import { ConversationFiltersInput, MessageFiltersInput } from './schemas.js';

export interface ParticipantInfo {
  id: string;
  profile: { displayName: string; avatarUrl: string | null } | null;
}

export interface ConversationWithDetails extends Conversation {
  session: {
    id: string;
    status: string;
    offer: {
      id: string;
      title: string;
      type: string;
    };
  };
  participants: ParticipantInfo[];
  lastMessage: Message | null;
  _count: { messages: number };
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
}

export class MessageRepository {
  /**
   * Fetch participant details from user IDs
   */
  private async getParticipantDetails(participantIds: string[]): Promise<ParticipantInfo[]> {
    const users = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        profile: { select: { displayName: true, avatarUrl: true } },
      },
    });
    return users;
  }

  async findOrCreateConversation(sessionId: string): Promise<Conversation> {
    // Check if conversation exists
    const existing = await prisma.conversation.findFirst({
      where: { sessionId },
    });

    if (existing) {
      return existing;
    }

    // Get session to find participants
    const session = await prisma.exchangeSession.findUnique({
      where: { id: sessionId },
      select: { initiatorId: true, responderId: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Create conversation with participantIds array
    return prisma.conversation.create({
      data: {
        sessionId,
        participantIds: [session.initiatorId, session.responderId],
      },
    });
  }

  async findConversationById(id: string): Promise<ConversationWithDetails | null> {
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            status: true,
            offer: {
              select: { id: true, title: true, type: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { messages: true } },
      },
    });

    if (!conv) return null;

    // Fetch participant details
    const participants = await this.getParticipantDetails(conv.participantIds);

    return {
      ...conv,
      participants,
      lastMessage: conv.messages[0] || null,
    };
  }

  async findConversationBySessionId(sessionId: string): Promise<Conversation | null> {
    return prisma.conversation.findFirst({
      where: { sessionId },
    });
  }

  async findUserConversations(
    userId: string,
    filters: ConversationFiltersInput
  ): Promise<{ conversations: ConversationWithDetails[]; total: number }> {
    const { skip, take } = getPaginationParams(filters);

    // Use participantIds array filter
    const where: Prisma.ConversationWhereInput = {
      participantIds: { has: userId },
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take,
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        include: {
          session: {
            select: {
              id: true,
              status: true,
              offer: {
                select: { id: true, title: true, type: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    // Fetch participant details for all conversations
    const allParticipantIds = [...new Set(conversations.flatMap((c) => c.participantIds))];
    const participantMap = new Map<string, ParticipantInfo>();

    const participantDetails = await this.getParticipantDetails(allParticipantIds);
    participantDetails.forEach((p) => participantMap.set(p.id, p));

    const conversationsWithDetails = conversations.map((conv) => ({
      ...conv,
      participants: conv.participantIds
        .map((pid) => participantMap.get(pid))
        .filter((p): p is ParticipantInfo => p !== undefined),
      lastMessage: conv.messages[0] || null,
    }));

    return {
      conversations: conversationsWithDetails,
      total,
    };
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: MessageType = 'text',
    metadata?: Record<string, any>
  ): Promise<MessageWithSender> {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
        metadata: metadata || {},
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async findMessages(
    conversationId: string,
    filters: MessageFiltersInput
  ): Promise<{ messages: MessageWithSender[]; total: number }> {
    const { skip, take } = getPaginationParams(filters);

    const where: Prisma.MessageWhereInput = { conversationId };

    if (filters.before) {
      where.createdAt = { lt: new Date(filters.before) };
    }

    if (filters.after) {
      where.createdAt = { ...(where.createdAt as object), gt: new Date(filters.after) };
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.message.count({ where }),
    ]);

    return { messages, total };
  }

  async markAsRead(conversationId: string, userId: string): Promise<number> {
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { in: ['sent', 'delivered'] },
      },
      data: {
        status: 'seen',
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const conv = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participantIds: { has: userId },
      },
    });

    return !!conv;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.message.count({
      where: {
        conversation: {
          participantIds: { has: userId },
        },
        senderId: { not: userId },
        status: { in: ['sent', 'delivered'] },
      },
    });
  }
}

export const messageRepository = new MessageRepository();
