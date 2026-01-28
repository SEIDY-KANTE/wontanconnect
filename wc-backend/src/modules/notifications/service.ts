import { notificationRepository, pushTokenRepository } from './repository.js';
import { Errors } from '../../shared/errors.js';
import { calculatePagination, PaginationMeta } from '../../shared/pagination.js';
import type {
  CreateNotificationInput,
  RegisterPushTokenInput,
  NotificationFiltersInput,
} from './schemas.js';
import { Notification, NotificationType, NotificationChannel, PushToken } from '@prisma/client';
import { logger } from '../../config/logger.js';

class NotificationService {
  /**
   * Create and send a notification
   * This is the main entry point for creating notifications from other modules
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const notification = await notificationRepository.create(
      input.userId,
      input.type as NotificationType,
      input.title,
      input.body,
      input.data,
      input.channels as NotificationChannel[]
    );

    // Handle push notification if channel includes 'push'
    if (input.channels.includes('push')) {
      this.sendPushNotification(input.userId, {
        title: input.title,
        body: input.body,
        data: input.data,
      }).catch((err) => {
        logger.error({ err, userId: input.userId }, 'Failed to send push notification');
      });
    }

    return notification;
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    filters: NotificationFiltersInput
  ): Promise<{ notifications: Notification[]; pagination: PaginationMeta }> {
    const { notifications, total } = await notificationRepository.findByUserId(userId, filters);
    const pagination = calculatePagination(filters.page, filters.limit, total);

    return { notifications, pagination };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw Errors.notFound('Notification');
    }

    if (notification.userId !== userId) {
      throw Errors.forbidden('You can only mark your own notifications as read');
    }

    return notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    const markedCount = await notificationRepository.markAllAsRead(userId);
    return { markedCount };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  /**
   * Register push token
   */
  async registerPushToken(userId: string, input: RegisterPushTokenInput): Promise<PushToken> {
    return pushTokenRepository.upsert(userId, input.token, input.platform, input.deviceId);
  }

  /**
   * Unregister push token
   */
  async unregisterPushToken(token: string): Promise<void> {
    await pushTokenRepository.deleteByToken(token);
  }

  /**
   * Send push notification (placeholder - integrate with FCM/APNs)
   */
  private async sendPushNotification(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, any> }
  ): Promise<void> {
    const tokens = await pushTokenRepository.findByUserId(userId);

    if (tokens.length === 0) {
      logger.debug({ userId }, 'No push tokens registered for user');
      return;
    }

    // TODO: Integrate with Firebase Cloud Messaging or Apple Push Notification Service
    // For now, just log the intent
    logger.info(
      {
        userId,
        tokenCount: tokens.length,
        title: payload.title,
      },
      'Would send push notification'
    );

    // Example FCM integration:
    // for (const token of tokens) {
    //   await admin.messaging().send({
    //     token: token.token,
    //     notification: {
    //       title: payload.title,
    //       body: payload.body,
    //     },
    //     data: payload.data,
    //   });
    // }
  }

  // ============ Notification Factory Methods ============

  /**
   * Notify about new session request
   */
  async notifySessionRequest(
    offerOwnerId: string,
    sessionId: string,
    initiatorName: string,
    offerTitle: string
  ): Promise<void> {
    await this.createNotification({
      userId: offerOwnerId,
      type: 'session_request',
      title: 'New Exchange Request',
      body: `${initiatorName} wants to exchange with you on "${offerTitle}"`,
      data: { sessionId },
      channels: ['push', 'in_app'],
    });
  }

  /**
   * Notify about session acceptance
   */
  async notifySessionAccepted(
    initiatorId: string,
    sessionId: string,
    offerTitle: string
  ): Promise<void> {
    await this.createNotification({
      userId: initiatorId,
      type: 'session_accepted',
      title: 'Request Accepted!',
      body: `Your exchange request for "${offerTitle}" has been accepted`,
      data: { sessionId },
      channels: ['push', 'in_app'],
    });
  }

  /**
   * Notify about session decline
   */
  async notifySessionDeclined(
    initiatorId: string,
    sessionId: string,
    offerTitle: string
  ): Promise<void> {
    await this.createNotification({
      userId: initiatorId,
      type: 'session_declined',
      title: 'Request Declined',
      body: `Your exchange request for "${offerTitle}" was declined`,
      data: { sessionId },
      channels: ['in_app'],
    });
  }

  /**
   * Notify about new message
   */
  async notifyNewMessage(
    recipientId: string,
    conversationId: string,
    senderName: string
  ): Promise<void> {
    await this.createNotification({
      userId: recipientId,
      type: 'new_message',
      title: 'New Message',
      body: `${senderName} sent you a message`,
      data: { conversationId },
      channels: ['push', 'in_app'],
    });
  }

  /**
   * Notify about received rating
   */
  async notifyRatingReceived(
    revieweeId: string,
    score: number,
    reviewerName: string
  ): Promise<void> {
    await this.createNotification({
      userId: revieweeId,
      type: 'rating_received',
      title: 'New Rating Received',
      body: `${reviewerName} gave you a ${score}-star rating`,
      data: { score },
      channels: ['in_app'],
    });
  }
}

export const notificationService = new NotificationService();
