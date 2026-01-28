import { prisma } from '../../config/database.js';
import { AuditLog } from '@prisma/client';

export interface CreateAuditLogInput {
  action: string;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
  metadata?: unknown;
}

export class AuditRepository {
  async create(data: CreateAuditLogInput): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        actorId: data.actorId,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues as object | undefined,
        newValues: data.newValues as object | undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata as object | undefined,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByActor(actorId: string, limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export const auditRepository = new AuditRepository();
