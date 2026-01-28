import { Router } from 'express';
import { messageController } from './controller.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authMiddleware, requireUser } from '../../middleware/auth.js';
import {
  createMessageSchema,
  messageFiltersSchema,
  conversationFiltersSchema,
  conversationIdParamSchema,
} from './schemas.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List conversations
router.get(
  '/',
  validateQuery(conversationFiltersSchema),
  messageController.listConversations.bind(messageController)
);

// Get unread count
router.get('/unread', messageController.getUnreadCount.bind(messageController));

// Get conversation
router.get(
  '/:id',
  validateParams(conversationIdParamSchema),
  messageController.getConversation.bind(messageController)
);

// Get messages in conversation
router.get(
  '/:id/messages',
  validateParams(conversationIdParamSchema),
  validateQuery(messageFiltersSchema),
  messageController.getMessages.bind(messageController)
);

// Send message
router.post(
  '/:id/messages',
  requireUser,
  validateParams(conversationIdParamSchema),
  validateBody(createMessageSchema),
  messageController.sendMessage.bind(messageController)
);

// Mark conversation as read
router.patch(
  '/:id/read',
  validateParams(conversationIdParamSchema),
  messageController.markAsRead.bind(messageController)
);

export { router as messageRoutes };
