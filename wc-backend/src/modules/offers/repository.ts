import { prisma } from '../../config/database.js';
import { Offer, OfferType, OfferStatus, Prisma } from '@prisma/client';
import { OfferFiltersInput, CreateOfferInput, UpdateOfferInput } from './schemas.js';
import { getPaginationParams } from '../../shared/pagination.js';

export interface OfferWithUser extends Offer {
  user: {
    id: string;
    profile: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
    trustProfile: {
      trustScore: number;
    } | null;
  };
}

export class OfferRepository {
  async create(userId: string, data: CreateOfferInput): Promise<Offer> {
    const baseData = {
      userId,
      type: data.type as OfferType,
      title: data.title,
      description: data.description,
      locationCity: data.locationCity,
      locationCountry: data.locationCountry,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    };

    if (data.type === 'fx') {
      return prisma.offer.create({
        data: {
          ...baseData,
          sourceCurrency: data.sourceCurrency,
          targetCurrency: data.targetCurrency,
          sourceAmount: data.sourceAmount,
          rate: data.rate,
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
          rateType: data.rateType,
          paymentMethods: data.paymentMethods || [],
        },
      });
    } else {
      return prisma.offer.create({
        data: {
          ...baseData,
          originCity: data.originCity,
          originCountry: data.originCountry,
          destinationCity: data.destinationCity,
          destinationCountry: data.destinationCountry,
          departureDate: new Date(data.departureDate),
          arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
          maxWeightKg: data.maxWeightKg,
          pricePerKg: data.pricePerKg,
          acceptedItems: data.acceptedItems || [],
          restrictedItems: data.restrictedItems || [],
        },
      });
    }
  }

  async findById(id: string): Promise<OfferWithUser | null> {
    return prisma.offer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
            trustProfile: {
              select: {
                trustScore: true,
              },
            },
          },
        },
      },
    });
  }

  async findMany(filters: OfferFiltersInput): Promise<{ offers: OfferWithUser[]; total: number }> {
    const { skip, take } = getPaginationParams(filters);

    const where: Prisma.OfferWhereInput = {
      status: (filters.status as OfferStatus) || 'active',
    };

    if (filters.type) {
      where.type = filters.type as OfferType;
    }

    if (filters.locationCountry) {
      where.locationCountry = filters.locationCountry;
    }

    if (filters.locationCity) {
      where.locationCity = { contains: filters.locationCity, mode: 'insensitive' };
    }

    // FX-specific filters
    if (filters.sourceCurrency) {
      where.sourceCurrency = filters.sourceCurrency;
    }

    if (filters.targetCurrency) {
      where.targetCurrency = filters.targetCurrency;
    }

    if (filters.minAmount !== undefined) {
      where.sourceAmount = { gte: filters.minAmount };
    }

    if (filters.maxAmount !== undefined) {
      where.sourceAmount = {
        ...(where.sourceAmount as object),
        lte: filters.maxAmount,
      };
    }

    // Shipping-specific filters
    if (filters.originCountry) {
      where.originCountry = filters.originCountry;
    }

    if (filters.destinationCountry) {
      where.destinationCountry = filters.destinationCountry;
    }

    // Sorting
    const orderBy: Prisma.OfferOrderByWithRelationInput = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
              trustProfile: {
                select: {
                  trustScore: true,
                },
              },
            },
          },
        },
      }),
      prisma.offer.count({ where }),
    ]);

    return { offers, total };
  }

  async findByUserId(
    userId: string,
    filters: { page: number; limit: number }
  ): Promise<{ offers: Offer[]; total: number }> {
    const { skip, take } = getPaginationParams(filters);

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offer.count({ where: { userId } }),
    ]);

    return { offers, total };
  }

  async update(id: string, data: UpdateOfferInput): Promise<Offer> {
    const updateData: Prisma.OfferUpdateInput = {};

    // Map fields to update
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status as OfferStatus;
    if (data.locationCity !== undefined) updateData.locationCity = data.locationCity;
    if (data.locationCountry !== undefined) updateData.locationCountry = data.locationCountry;
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    // FX fields
    if (data.sourceAmount !== undefined) updateData.sourceAmount = data.sourceAmount;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.minAmount !== undefined) updateData.minAmount = data.minAmount;
    if (data.maxAmount !== undefined) updateData.maxAmount = data.maxAmount;
    if (data.rateType !== undefined) updateData.rateType = data.rateType;
    if (data.paymentMethods !== undefined) updateData.paymentMethods = data.paymentMethods;

    // Shipping fields
    if (data.departureDate !== undefined) {
      updateData.departureDate = new Date(data.departureDate);
    }
    if (data.arrivalDate !== undefined) {
      updateData.arrivalDate = data.arrivalDate ? new Date(data.arrivalDate) : null;
    }
    if (data.maxWeightKg !== undefined) updateData.maxWeightKg = data.maxWeightKg;
    if (data.pricePerKg !== undefined) updateData.pricePerKg = data.pricePerKg;
    if (data.acceptedItems !== undefined) updateData.acceptedItems = data.acceptedItems;
    if (data.restrictedItems !== undefined) updateData.restrictedItems = data.restrictedItems;

    return prisma.offer.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<Offer> {
    return prisma.offer.update({
      where: { id },
      data: { status: 'expired' },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await prisma.offer.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}

export const offerRepository = new OfferRepository();
