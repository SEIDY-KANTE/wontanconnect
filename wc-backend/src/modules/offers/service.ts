import { offerRepository, OfferWithUser } from './repository.js';
import { auditService } from '../audit/service.js';
import { AUDIT_ACTIONS } from '../../shared/constants.js';
import { Errors } from '../../shared/errors.js';
import { calculatePagination, PaginationMeta } from '../../shared/pagination.js';
import type { CreateOfferInput, UpdateOfferInput, OfferFiltersInput } from './schemas.js';
import { Offer } from '@prisma/client';

class OfferService {
  async createOffer(
    userId: string,
    input: CreateOfferInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Offer> {
    const offer = await offerRepository.create(userId, input);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.OFFER_CREATE,
      actorId: userId,
      entityType: 'offer',
      entityId: offer.id,
      newValues: offer,
      ipAddress,
      userAgent,
    });

    return offer;
  }

  async getOffer(id: string, incrementView = false): Promise<OfferWithUser | null> {
    const offer = await offerRepository.findById(id);

    if (offer && incrementView) {
      // Don't await - fire and forget
      offerRepository.incrementViewCount(id).catch(() => {});
    }

    return offer;
  }

  async listOffers(
    filters: OfferFiltersInput
  ): Promise<{ offers: OfferWithUser[]; pagination: PaginationMeta }> {
    const { offers, total } = await offerRepository.findMany(filters);
    const pagination = calculatePagination(filters.page, filters.limit, total);

    return { offers, pagination };
  }

  async getMyOffers(
    userId: string,
    filters: { page: number; limit: number }
  ): Promise<{ offers: Offer[]; pagination: PaginationMeta }> {
    const { offers, total } = await offerRepository.findByUserId(userId, filters);
    const pagination = calculatePagination(filters.page, filters.limit, total);

    return { offers, pagination };
  }

  async updateOffer(
    userId: string,
    offerId: string,
    input: UpdateOfferInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Offer> {
    const existingOffer = await offerRepository.findById(offerId);

    if (!existingOffer) {
      throw Errors.notFound('Offer');
    }

    if (existingOffer.userId !== userId) {
      throw Errors.forbidden('You can only update your own offers');
    }

    if (existingOffer.status === 'expired' || existingOffer.status === 'completed') {
      throw Errors.invalidSessionState('Cannot update expired or completed offer');
    }

    const updatedOffer = await offerRepository.update(offerId, input);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.OFFER_UPDATE,
      actorId: userId,
      entityType: 'offer',
      entityId: offerId,
      oldValues: existingOffer,
      newValues: updatedOffer,
      ipAddress,
      userAgent,
    });

    return updatedOffer;
  }

  async deleteOffer(
    userId: string,
    offerId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const existingOffer = await offerRepository.findById(offerId);

    if (!existingOffer) {
      throw Errors.notFound('Offer');
    }

    if (existingOffer.userId !== userId) {
      throw Errors.forbidden('You can only delete your own offers');
    }

    await offerRepository.delete(offerId);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.OFFER_DELETE,
      actorId: userId,
      entityType: 'offer',
      entityId: offerId,
      oldValues: { status: existingOffer.status },
      newValues: { status: 'expired' },
      ipAddress,
      userAgent,
    });
  }
}

export const offerService = new OfferService();
