import { Request, Response, NextFunction } from 'express';
import { notificationService } from './service.js';
import { sendSuccess } from '../../shared/response.js';
import type { RegisterPushTokenInput, NotificationFiltersInput } from './schemas.js';

function formatNotification(notif: any) {
  return {
    id: notif.id,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    data: notif.data,
    channels: notif.channels,
    read: !!notif.readAt,
    readAt: notif.readAt,
    createdAt: notif.createdAt,
  };
}

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as unknown as NotificationFiltersInput;
      const { notifications, pagination } = await notificationService.getNotifications(
        req.auth!.userId,
        filters
      );
      sendSuccess(res, notifications.map(formatNotification), 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(req.auth!.userId);
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(req.auth!.userId, id!);
      sendSuccess(res, formatNotification(notification));
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.markAllAsRead(req.auth!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async registerPushToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterPushTokenInput;
      const token = await notificationService.registerPushToken(req.auth!.userId, input);
      sendSuccess(res, { id: token.id, platform: token.platform }, 201);
    } catch (error) {
      next(error);
    }
  }

  async unregisterPushToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      await notificationService.unregisterPushToken(token);
      sendSuccess(res, { message: 'Push token unregistered' });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
