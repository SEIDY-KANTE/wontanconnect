import { Request, Response, NextFunction } from 'express';
import { offerService } from './service.js';
import { sendSuccess, sendError } from '../../shared/response.js';
import { getClientIp, getUserAgent } from '../../shared/utils.js';
import type { CreateOfferInput, UpdateOfferInput, OfferFiltersInput } from './schemas.js';

export class OfferController {
  async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateOfferInput;
      const offer = await offerService.createOffer(
        req.auth!.userId,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, offer, 201);
    } catch (error) {
      next(error);
    }
  }

  async getOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const offer = await offerService.getOffer(id!, true);

      if (!offer) {
        sendError(res, 'RESOURCE_NOT_FOUND', 'Offer not found', 404);
        return;
      }

      sendSuccess(res, {
        id: offer.id,
        type: offer.type,
        status: offer.status,
        title: offer.title,
        description: offer.description,
        location: {
          city: offer.locationCity,
          country: offer.locationCountry,
        },
        user: {
          id: offer.user.id,
          displayName: offer.user.profile?.displayName,
          avatarUrl: offer.user.profile?.avatarUrl,
          trustScore: offer.user.trustProfile?.trustScore || 0,
        },
        ...(offer.type === 'fx' && {
          fx: {
            sourceCurrency: offer.sourceCurrency,
            targetCurrency: offer.targetCurrency,
            sourceAmount: Number(offer.sourceAmount),
            rate: Number(offer.rate),
            minAmount: offer.minAmount ? Number(offer.minAmount) : null,
            maxAmount: offer.maxAmount ? Number(offer.maxAmount) : null,
            rateType: offer.rateType,
            paymentMethods: offer.paymentMethods,
          },
        }),
        ...(offer.type === 'shipping' && {
          shipping: {
            origin: {
              city: offer.originCity,
              country: offer.originCountry,
            },
            destination: {
              city: offer.destinationCity,
              country: offer.destinationCountry,
            },
            departureDate: offer.departureDate,
            arrivalDate: offer.arrivalDate,
            maxWeightKg: Number(offer.maxWeightKg),
            pricePerKg: Number(offer.pricePerKg),
            acceptedItems: offer.acceptedItems,
            restrictedItems: offer.restrictedItems,
          },
        }),
        viewCount: offer.viewCount,
        expiresAt: offer.expiresAt,
        createdAt: offer.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async listOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as unknown as OfferFiltersInput;
      const { offers, pagination } = await offerService.listOffers(filters);

      const formattedOffers = offers.map((offer) => ({
        id: offer.id,
        type: offer.type,
        status: offer.status,
        title: offer.title,
        user: {
          id: offer.user.id,
          displayName: offer.user.profile?.displayName,
          avatarUrl: offer.user.profile?.avatarUrl,
          trustScore: offer.user.trustProfile?.trustScore || 0,
        },
        location: {
          city: offer.locationCity,
          country: offer.locationCountry,
        },
        ...(offer.type === 'fx' && {
          fx: {
            sourceCurrency: offer.sourceCurrency,
            targetCurrency: offer.targetCurrency,
            sourceAmount: Number(offer.sourceAmount),
            rate: Number(offer.rate),
            rateType: offer.rateType,
            minAmount: offer.minAmount ? Number(offer.minAmount) : null,
          },
        }),
        ...(offer.type === 'shipping' && {
          shipping: {
            origin: { city: offer.originCity, country: offer.originCountry },
            destination: { city: offer.destinationCity, country: offer.destinationCountry },
            departureDate: offer.departureDate,
            maxWeightKg: Number(offer.maxWeightKg),
            pricePerKg: Number(offer.pricePerKg),
          },
        }),
        createdAt: offer.createdAt,
      }));

      sendSuccess(res, formattedOffers, 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getMyOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as unknown as { page: number; limit: number };
      const { offers, pagination } = await offerService.getMyOffers(req.auth!.userId, filters);
      sendSuccess(res, offers, 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateOfferInput;
      const offer = await offerService.updateOffer(
        req.auth!.userId,
        id!,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, offer);
    } catch (error) {
      next(error);
    }
  }

  async deleteOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await offerService.deleteOffer(req.auth!.userId, id!, getClientIp(req), getUserAgent(req));
      sendSuccess(res, { message: 'Offer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const offerController = new OfferController();
