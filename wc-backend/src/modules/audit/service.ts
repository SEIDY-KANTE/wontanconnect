import { auditRepository, CreateAuditLogInput } from './repository.js';
import { logger } from '../../config/logger.js';

class AuditService {
  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await auditRepository.create(input);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      // Just log the error
      logger.error({ error, input }, 'Failed to create audit log');
    }
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return auditRepository.findByEntity(entityType, entityId);
  }

  async getUserActivity(userId: string, limit?: number) {
    return auditRepository.findByActor(userId, limit);
  }
}

export const auditService = new AuditService();
