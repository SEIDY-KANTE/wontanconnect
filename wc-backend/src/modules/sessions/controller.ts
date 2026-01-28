import { Request, Response, NextFunction } from 'express';
import { sessionService } from './service.js';
import { sendSuccess } from '../../shared/response.js';
import { getClientIp, getUserAgent } from '../../shared/utils.js';
import type {
  CreateSessionInput,
  AcceptSessionInput,
  DeclineSessionInput,
  CancelSessionInput,
  ConfirmSessionInput,
  SessionFiltersInput,
} from './schemas.js';

function formatSession(session: any) {
  return {
    id: session.id,
    status: session.status,
    offer: {
      id: session.offer.id,
      type: session.offer.type,
      title: session.offer.title,
      ...(session.offer.type === 'fx' && {
        sourceCurrency: session.offer.sourceCurrency,
        targetCurrency: session.offer.targetCurrency,
        sourceAmount: session.offer.sourceAmount ? Number(session.offer.sourceAmount) : null,
        rate: session.offer.rate ? Number(session.offer.rate) : null,
      }),
      ...(session.offer.type === 'shipping' && {
        origin: { city: session.offer.originCity, country: session.offer.originCountry },
        destination: {
          city: session.offer.destinationCity,
          country: session.offer.destinationCountry,
        },
      }),
    },
    initiator: {
      id: session.initiator.id,
      displayName: session.initiator.profile?.displayName,
      avatarUrl: session.initiator.profile?.avatarUrl,
      trustScore: session.initiator.trustProfile?.trustScore || 0,
    },
    responder: {
      id: session.responder.id,
      displayName: session.responder.profile?.displayName,
      avatarUrl: session.responder.profile?.avatarUrl,
      trustScore: session.responder.trustProfile?.trustScore || 0,
    },
    agreedAmount: session.agreedAmount ? Number(session.agreedAmount) : null,
    confirmations: session.confirmations.map((c: any) => ({
      id: c.id,
      userId: c.userId,
      type: c.type,
      notes: c.notes,
      confirmedAt: c.confirmedAt,
    })),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export class SessionController {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateSessionInput;
      const session = await sessionService.createSession(
        req.auth!.userId,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, formatSession(session), 201);
    } catch (error) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await sessionService.getSession(req.auth!.userId, id!);
      sendSuccess(res, formatSession(session));
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as unknown as SessionFiltersInput;
      const { sessions, pagination } = await sessionService.listSessions(req.auth!.userId, filters);
      sendSuccess(res, sessions.map(formatSession), 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async acceptSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = (req.body || {}) as AcceptSessionInput;
      const session = await sessionService.acceptSession(
        req.auth!.userId,
        id!,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, formatSession(session));
    } catch (error) {
      next(error);
    }
  }

  async declineSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = (req.body || {}) as DeclineSessionInput;
      const session = await sessionService.declineSession(
        req.auth!.userId,
        id!,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, formatSession(session));
    } catch (error) {
      next(error);
    }
  }

  async cancelSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = (req.body || {}) as CancelSessionInput;
      const session = await sessionService.cancelSession(
        req.auth!.userId,
        id!,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, formatSession(session));
    } catch (error) {
      next(error);
    }
  }

  async confirmSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as ConfirmSessionInput;
      const session = await sessionService.confirmSession(
        req.auth!.userId,
        id!,
        input,
        getClientIp(req),
        getUserAgent(req)
      );
      sendSuccess(res, formatSession(session));
    } catch (error) {
      next(error);
    }
  }
}

export const sessionController = new SessionController();
