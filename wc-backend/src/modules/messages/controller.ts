import { Request, Response, NextFunction } from 'express';
import { messageService } from './service.js';
import { sendSuccess } from '../../shared/response.js';
import { getClientIp, getUserAgent } from '../../shared/utils.js';
import type {
  CreateMessageInput,
  MessageFiltersInput,
  ConversationFiltersInput,
} from './schemas.js';

function formatConversation(conv: any, userId: string) {
  const otherParticipant = conv.participants.find((p: any) => p.id !== userId);
  return {
    id: conv.id,
    sessionId: conv.sessionId,
    session: {
      id: conv.session.id,
      status: conv.session.status,
      offer: conv.session.offer,
    },
    otherParticipant: otherParticipant
      ? {
          id: otherParticipant.id,
          displayName: otherParticipant.profile?.displayName,
          avatarUrl: otherParticipant.profile?.avatarUrl,
        }
      : null,
    lastMessage: conv.lastMessage
      ? {
          id: conv.lastMessage.id,
          content: conv.lastMessage.content,
          type: conv.lastMessage.type,
          senderId: conv.lastMessage.senderId,
          createdAt: conv.lastMessage.createdAt,
        }
      : null,
    messageCount: conv._count.messages,
    updatedAt: conv.updatedAt,
  };
}

function formatMessage(msg: any) {
  return {
    id: msg.id,
    content: msg.content,
    type: msg.type,
    status: msg.status,
    metadata: msg.metadata,
    sender: {
      id: msg.sender.id,
      displayName: msg.sender.profile?.displayName,
      avatarUrl: msg.sender.profile?.avatarUrl,
    },
    createdAt: msg.createdAt,
  };
}

export class MessageController {
  async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as unknown as ConversationFiltersInput;
      const { conversations, pagination } = await messageService.listConversations(
        req.auth!.userId,
        filters
      );
      sendSuccess(
        res,
        conversations.map((c) => formatConversation(c, req.auth!.userId)),
        200,
        pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversation = await messageService.getConversation(req.auth!.userId, id!);
      sendSuccess(res, formatConversation(conversation, req.auth!.userId));
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as CreateMessageInput;
      const message = await messageService.sendMessage(
        req.auth!.userId,
        id!,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, formatMessage(message), 201);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const filters = req.query as unknown as MessageFiltersInput;
      const { messages, pagination } = await messageService.getMessages(
        req.auth!.userId,
        id!,
        filters
      );
      sendSuccess(res, messages.map(formatMessage), 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await messageService.markAsRead(req.auth!.userId, id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await messageService.getUnreadCount(req.auth!.userId);
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
