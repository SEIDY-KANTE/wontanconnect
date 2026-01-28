import { sessionRepository, SessionWithDetails } from './repository.js';
import { offerRepository } from '../offers/repository.js';
import { messageRepository } from '../messages/repository.js';
import { auditService } from '../audit/service.js';
import { AUDIT_ACTIONS } from '../../shared/constants.js';
import { Errors } from '../../shared/errors.js';
import { calculatePagination, PaginationMeta } from '../../shared/pagination.js';
import { broadcastSessionUpdate } from '../websocket/index.js';
import type {
  CreateSessionInput,
  AcceptSessionInput,
  DeclineSessionInput,
  CancelSessionInput,
  ConfirmSessionInput,
  SessionFiltersInput,
} from './schemas.js';
import { SessionStatus, ConfirmationType } from '@prisma/client';

// State machine: valid transitions
const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  pending: ['accepted', 'declined', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  declined: [],
  in_progress: ['awaiting_confirmation', 'completed', 'disputed', 'cancelled'],
  awaiting_confirmation: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  disputed: ['completed', 'cancelled'],
};

/**
 * Helper to broadcast session status change
 */
function notifySessionUpdate(session: SessionWithDetails, updatedBy: string): void {
  try {
    const participantIds = [session.initiatorId, session.responderId];
    broadcastSessionUpdate(session.id, participantIds, {
      sessionId: session.id,
      status: session.status,
      updatedBy,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Non-blocking
    console.error('WebSocket broadcast error:', error);
  }
}

class SessionService {
  private canTransition(from: SessionStatus, to: SessionStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  async createSession(
    userId: string,
    input: CreateSessionInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionWithDetails> {
    // Get the offer
    const offer = await offerRepository.findById(input.offerId);

    if (!offer) {
      throw Errors.notFound('Offer');
    }

    if (offer.status !== 'active') {
      throw Errors.invalidSessionState('Offer is not active');
    }

    // Can't create session on own offer
    if (offer.userId === userId) {
      throw Errors.forbidden('Cannot create session on your own offer');
    }

    // Check if user already has an active session for this offer
    const existingSession = await sessionRepository.findByUserIdAndOfferId(userId, input.offerId);
    if (existingSession) {
      throw Errors.alreadyExists('Session for this offer');
    }

    const session = await sessionRepository.create(userId, offer.userId, input, offer.type);
    const fullSession = await sessionRepository.findById(session.id);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.SESSION_CREATE,
      actorId: userId,
      entityType: 'session',
      entityId: session.id,
      newValues: { offerId: input.offerId, proposedAmount: input.proposedAmount },
      ipAddress,
      userAgent,
    });

    return fullSession!;
  }

  async getSession(userId: string, sessionId: string): Promise<SessionWithDetails> {
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw Errors.notFound('Session');
    }

    // Only participants can view the session
    if (session.initiatorId !== userId && session.responderId !== userId) {
      throw Errors.forbidden('You are not a participant in this session');
    }

    return session;
  }

  async listSessions(
    userId: string,
    filters: SessionFiltersInput
  ): Promise<{ sessions: SessionWithDetails[]; pagination: PaginationMeta }> {
    const { sessions, total } = await sessionRepository.findMany(userId, filters);
    const pagination = calculatePagination(filters.page, filters.limit, total);

    return { sessions, pagination };
  }

  async acceptSession(
    userId: string,
    sessionId: string,
    input: AcceptSessionInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionWithDetails> {
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw Errors.notFound('Session');
    }

    // Only responder (offer owner) can accept
    if (session.responderId !== userId) {
      throw Errors.forbidden('Only the offer owner can accept sessions');
    }

    if (!this.canTransition(session.status, 'accepted')) {
      throw Errors.invalidSessionState(`Cannot accept session in ${session.status} state`);
    }

    // Update terms if provided
    if (input.acceptedAmount !== undefined) {
      const currentTerms = (session.agreedTerms as Record<string, unknown>) || {};
      await sessionRepository.updateAgreedTerms(sessionId, {
        ...currentTerms,
        acceptedAmount: input.acceptedAmount,
      });
    }

    await sessionRepository.updateStatus(sessionId, 'accepted');

    // Create conversation for the accepted session
    await messageRepository.findOrCreateConversation(sessionId);

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.SESSION_ACCEPT,
      actorId: userId,
      entityType: 'session',
      entityId: sessionId,
      oldValues: { status: session.status },
      newValues: { status: 'accepted', acceptedAmount: input.acceptedAmount },
      ipAddress,
      userAgent,
    });

    const updatedSession = (await sessionRepository.findById(sessionId))!;

    // Notify via WebSocket
    notifySessionUpdate(updatedSession, userId);

    return updatedSession;
  }

  async declineSession(
    userId: string,
    sessionId: string,
    input: DeclineSessionInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionWithDetails> {
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw Errors.notFound('Session');
    }

    // Only responder can decline
    if (session.responderId !== userId) {
      throw Errors.forbidden('Only the offer owner can decline sessions');
    }

    if (session.status !== 'pending') {
      throw Errors.invalidSessionState(`Cannot decline session in ${session.status} state`);
    }

    await sessionRepository.updateStatus(sessionId, 'declined');

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.SESSION_DECLINE,
      actorId: userId,
      entityType: 'session',
      entityId: sessionId,
      oldValues: { status: session.status },
      newValues: { status: 'declined', reason: input.reason },
      ipAddress,
      userAgent,
    });

    const updatedSession = (await sessionRepository.findById(sessionId))!;

    // Notify via WebSocket
    notifySessionUpdate(updatedSession, userId);

    return updatedSession;
  }

  async cancelSession(
    userId: string,
    sessionId: string,
    input: CancelSessionInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionWithDetails> {
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw Errors.notFound('Session');
    }

    // Both participants can cancel
    if (session.initiatorId !== userId && session.responderId !== userId) {
      throw Errors.forbidden('You are not a participant in this session');
    }

    if (!this.canTransition(session.status, 'cancelled')) {
      throw Errors.invalidSessionState(`Cannot cancel session in ${session.status} state`);
    }

    await sessionRepository.updateStatus(sessionId, 'cancelled');

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.SESSION_CANCEL,
      actorId: userId,
      entityType: 'session',
      entityId: sessionId,
      oldValues: { status: session.status },
      newValues: { status: 'cancelled', reason: input.reason },
      ipAddress,
      userAgent,
    });

    const updatedSession = (await sessionRepository.findById(sessionId))!;

    // Notify via WebSocket
    notifySessionUpdate(updatedSession, userId);

    return updatedSession;
  }

  async confirmSession(
    userId: string,
    sessionId: string,
    input: ConfirmSessionInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionWithDetails> {
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw Errors.notFound('Session');
    }

    // Only participants can confirm
    if (session.initiatorId !== userId && session.responderId !== userId) {
      throw Errors.forbidden('You are not a participant in this session');
    }

    // Session must be accepted or in_progress
    if (session.status !== 'accepted' && session.status !== 'in_progress') {
      throw Errors.invalidSessionState(`Cannot confirm in ${session.status} state`);
    }

    // Check if user already submitted this confirmation type
    const existingConfirmation = await sessionRepository.findConfirmation(
      sessionId,
      userId,
      input.confirmationType as ConfirmationType
    );

    if (existingConfirmation) {
      throw Errors.alreadyExists('Confirmation');
    }

    // Create confirmation
    await sessionRepository.createConfirmation(
      sessionId,
      userId,
      input.confirmationType as ConfirmationType,
      input.notes
    );

    // Move to in_progress if needed
    if (session.status === 'accepted') {
      await sessionRepository.updateStatus(sessionId, 'in_progress');
    }

    // Check if both parties have confirmed completion
    const confirmations = await sessionRepository.getConfirmations(sessionId);
    // Both parties need to confirm 'received' for completion
    const completionType: ConfirmationType = 'received';

    const initiatorCompleted = confirmations.some(
      (c) => c.userId === session.initiatorId && c.type === completionType
    );
    const responderCompleted = confirmations.some(
      (c) => c.userId === session.responderId && c.type === completionType
    );

    if (initiatorCompleted && responderCompleted) {
      await sessionRepository.updateStatus(sessionId, 'completed');
    }

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.SESSION_CONFIRM,
      actorId: userId,
      entityType: 'session',
      entityId: sessionId,
      newValues: { confirmationType: input.confirmationType, notes: input.notes },
      ipAddress,
      userAgent,
    });

    const updatedSession = (await sessionRepository.findById(sessionId))!;

    // Notify via WebSocket
    notifySessionUpdate(updatedSession, userId);

    return updatedSession;
  }
}

export const sessionService = new SessionService();
