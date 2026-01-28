import { prisma } from '../../config/database.js';
import {
  ExchangeSession,
  ExchangeConfirmation,
  SessionStatus,
  ConfirmationType,
  Prisma,
  OfferType,
} from '@prisma/client';
import { SessionFiltersInput, CreateSessionInput } from './schemas.js';
import { getPaginationParams } from '../../shared/pagination.js';

export interface SessionWithDetails extends ExchangeSession {
  offer: {
    id: string;
    type: string;
    title: string;
    status: string;
    sourceCurrency: string | null;
    targetCurrency: string | null;
    sourceAmount: Prisma.Decimal | null;
    rate: Prisma.Decimal | null;
    originCity: string | null;
    originCountry: string | null;
    destinationCity: string | null;
    destinationCountry: string | null;
  };
  initiator: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
    trustProfile: { trustScore: number } | null;
  };
  responder: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
    trustProfile: { trustScore: number } | null;
  };
  confirmations: ExchangeConfirmation[];
  conversation: { id: string } | null;
}

const sessionInclude = {
  offer: {
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      sourceCurrency: true,
      targetCurrency: true,
      sourceAmount: true,
      rate: true,
      originCity: true,
      originCountry: true,
      destinationCity: true,
      destinationCountry: true,
    },
  },
  initiator: {
    select: {
      id: true,
      profile: { select: { displayName: true, avatarUrl: true } },
      trustProfile: { select: { trustScore: true } },
    },
  },
  responder: {
    select: {
      id: true,
      profile: { select: { displayName: true, avatarUrl: true } },
      trustProfile: { select: { trustScore: true } },
    },
  },
  confirmations: true,
  conversation: {
    select: {
      id: true,
    },
  },
};

export class SessionRepository {
  async create(
    initiatorId: string,
    responderId: string,
    data: CreateSessionInput,
    offerType: OfferType
  ): Promise<ExchangeSession> {
    return prisma.exchangeSession.create({
      data: {
        offerId: data.offerId,
        initiatorId,
        responderId,
        type: offerType,
        agreedTerms: {
          proposedAmount: data.proposedAmount,
          message: data.message,
        },
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<SessionWithDetails | null> {
    return prisma.exchangeSession.findUnique({
      where: { id },
      include: sessionInclude,
    });
  }

  async isParticipant(sessionId: string, userId: string): Promise<boolean> {
    const session = await prisma.exchangeSession.findFirst({
      where: {
        id: sessionId,
        OR: [{ initiatorId: userId }, { responderId: userId }],
      },
      select: { id: true },
    });

    return !!session;
  }

  async findByUserIdAndOfferId(userId: string, offerId: string): Promise<ExchangeSession | null> {
    return prisma.exchangeSession.findFirst({
      where: {
        offerId,
        initiatorId: userId,
        status: { notIn: ['cancelled', 'completed'] },
      },
    });
  }

  async findMany(
    userId: string,
    filters: SessionFiltersInput
  ): Promise<{ sessions: SessionWithDetails[]; total: number }> {
    const { skip, take } = getPaginationParams(filters);

    const where: Prisma.ExchangeSessionWhereInput = {};

    // Filter by role
    if (filters.role === 'initiator') {
      where.initiatorId = userId;
    } else if (filters.role === 'responder') {
      where.responderId = userId;
    } else {
      where.OR = [{ initiatorId: userId }, { responderId: userId }];
    }

    // Filter by status
    if (filters.status) {
      where.status = filters.status as SessionStatus;
    }

    const [sessions, total] = await Promise.all([
      prisma.exchangeSession.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: sessionInclude,
      }),
      prisma.exchangeSession.count({ where }),
    ]);

    return { sessions, total };
  }

  async updateStatus(id: string, status: SessionStatus): Promise<ExchangeSession> {
    return prisma.exchangeSession.update({
      where: { id },
      data: { status },
    });
  }

  async updateAgreedTerms(
    id: string,
    agreedTerms: Prisma.InputJsonValue
  ): Promise<ExchangeSession> {
    return prisma.exchangeSession.update({
      where: { id },
      data: { agreedTerms },
    });
  }

  async createConfirmation(
    sessionId: string,
    userId: string,
    type: ConfirmationType,
    notes?: string
  ): Promise<ExchangeConfirmation> {
    return prisma.exchangeConfirmation.create({
      data: {
        sessionId,
        userId,
        type,
        notes,
      },
    });
  }

  async findConfirmation(
    sessionId: string,
    userId: string,
    type: ConfirmationType
  ): Promise<ExchangeConfirmation | null> {
    return prisma.exchangeConfirmation.findFirst({
      where: { sessionId, userId, type },
    });
  }

  async getConfirmations(sessionId: string): Promise<ExchangeConfirmation[]> {
    return prisma.exchangeConfirmation.findMany({
      where: { sessionId },
      orderBy: { confirmedAt: 'asc' },
    });
  }

  async countActiveSessionsForOffer(offerId: string): Promise<number> {
    return prisma.exchangeSession.count({
      where: {
        offerId,
        status: { in: ['pending', 'accepted', 'in_progress'] },
      },
    });
  }
}

export const sessionRepository = new SessionRepository();
