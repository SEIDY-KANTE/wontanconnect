import { prisma } from '../../config/database.js';
import {
  Notification,
  PushToken,
  NotificationType,
  NotificationChannel,
  Prisma,
} from '@prisma/client';
import { NotificationFiltersInput } from './schemas.js';
import { getPaginationParams } from '../../shared/pagination.js';

export class NotificationRepository {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
    channels: NotificationChannel[] = ['in_app']
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data || {},
        channels,
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  async findByUserId(
    userId: string,
    filters: NotificationFiltersInput
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { skip, take } = getPaginationParams(filters);

    const where: Prisma.NotificationWhereInput = { userId };

    if (filters.unreadOnly) {
      where.readAt = null;
    }

    if (filters.type) {
      where.type = filters.type as NotificationType;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({
      where: { id },
    });
  }

  async deleteOldNotifications(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        readAt: { not: null },
      },
    });

    return result.count;
  }
}

export class PushTokenRepository {
  async upsert(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId?: string
  ): Promise<PushToken> {
    // Find existing token for this user+device or token
    const existing = await prisma.pushToken.findFirst({
      where: {
        OR: [{ token }, { userId, deviceId: deviceId || undefined }],
      },
    });

    if (existing) {
      return prisma.pushToken.update({
        where: { id: existing.id },
        data: { token, platform, deviceId, updatedAt: new Date() },
      });
    }

    return prisma.pushToken.create({
      data: { userId, token, platform, deviceId },
    });
  }

  async findByUserId(userId: string): Promise<PushToken[]> {
    return prisma.pushToken.findMany({
      where: { userId },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.pushToken.delete({
      where: { id },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await prisma.pushToken.deleteMany({
      where: { token },
    });
  }
}

export const notificationRepository = new NotificationRepository();
export const pushTokenRepository = new PushTokenRepository();
