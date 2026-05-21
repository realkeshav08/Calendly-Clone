import { Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import { utcToZonedDateString } from '../../utils/timezone';
import type {
  IBookingRepository,
  BookingWithRelations,
} from '../../repositories/booking.repository';
import type { SlotService } from '../slots/slots.service';
import type { NotificationService } from '../../services/notification/notificationService';
import type { CreateBookingInput, CancelBookingInput, RescheduleBookingInput } from 'shared';

/**
 * Booking use cases. Orchestrates validation (is the slot still offered? are
 * required questions answered?), delegates the atomic conflict-checked insert to
 * the repository, and fires best-effort notifications. Every collaborator is
 * injected, so the whole flow is unit-testable with fakes.
 */
export class BookingService {
  constructor(
    private readonly bookings: IBookingRepository,
    private readonly slots: SlotService,
    private readonly notifications: NotificationService,
  ) {}

  /** Guards against booking a time the availability engine wouldn't actually offer. */
  private async assertSlotIsOffered(
    username: string,
    eventSlug: string,
    startIso: string,
    inviteeTimezone: string,
  ): Promise<void> {
    const dateStr = utcToZonedDateString(new Date(startIso), inviteeTimezone);
    const offered = await this.slots.getAvailableSlots(
      username,
      eventSlug,
      dateStr,
      inviteeTimezone,
    );
    if (!offered.includes(new Date(startIso).toISOString())) {
      throw new BadRequestError('That time is no longer available. Please pick another slot.');
    }
  }

  /** Every required custom question must have a non-empty answer. */
  private assertRequiredQuestionsAnswered(
    questions: { id: string; question: string; isRequired: boolean }[],
    answers: CreateBookingInput['answers'],
  ): void {
    const byQuestion = new Map((answers ?? []).map((a) => [a.questionId, a.answer.trim()]));
    for (const q of questions) {
      if (q.isRequired && !byQuestion.get(q.id)) {
        throw new BadRequestError(`Please answer the required question: "${q.question}"`);
      }
    }
  }

  async create(
    username: string,
    eventSlug: string,
    input: CreateBookingInput,
  ): Promise<BookingWithRelations> {
    const { user, eventType } = await this.slots.resolveContext(username, eventSlug);
    await this.assertSlotIsOffered(username, eventSlug, input.startTime, input.inviteeTimezone);
    this.assertRequiredQuestionsAnswered(eventType.customQuestions, input.answers);

    const start = new Date(input.startTime);
    const end = new Date(start.getTime() + eventType.durationMinutes * 60_000);

    const booking = await this.bookings.createIfSlotFree({
      eventTypeId: eventType.id,
      hostId: user.id,
      inviteeName: input.inviteeName,
      inviteeEmail: input.inviteeEmail,
      inviteeTimezone: input.inviteeTimezone,
      startTime: start,
      endTime: end,
      notes: input.notes ?? null,
      answers: input.answers ? (input.answers as unknown as Prisma.InputJsonValue) : undefined,
    });

    await this.notifications.sendBookingConfirmation(booking);
    return booking;
  }

  async getById(id: string): Promise<BookingWithRelations> {
    const booking = await this.bookings.findById(id);
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }

  /** Soft-cancel: marks CANCELLED (never hard-deletes) and notifies the invitee. */
  async cancel(id: string, input: CancelBookingInput): Promise<BookingWithRelations> {
    const booking = await this.getById(id);
    if (booking.status === 'CANCELLED') return booking;
    const updated = await this.bookings.updateStatus(id, 'CANCELLED', {
      cancelledAt: new Date(),
      cancellationReason: input.cancellationReason ?? null,
    });
    await this.notifications.sendBookingCancellation(updated);
    return updated;
  }

  /**
   * Reschedule: book the new time first (reusing all conflict protection), then
   * mark the original RESCHEDULED. Ordering matters — if the new slot is taken we
   * fail before touching the original, so the invitee never loses their seat.
   */
  async reschedule(id: string, input: RescheduleBookingInput): Promise<BookingWithRelations> {
    const existing = await this.getById(id);
    const replacement = await this.create(existing.host.username, existing.eventType.slug, {
      startTime: input.startTime,
      inviteeName: existing.inviteeName,
      inviteeEmail: existing.inviteeEmail,
      inviteeTimezone: existing.inviteeTimezone,
      notes: existing.notes,
      answers: (existing.answers as CreateBookingInput['answers']) ?? undefined,
    });
    await this.bookings.updateStatus(id, 'RESCHEDULED', { cancelledAt: new Date() });
    return replacement;
  }

  listForHost(hostId: string, filter: 'upcoming' | 'past'): Promise<BookingWithRelations[]> {
    return this.bookings.findManyByHost(hostId, filter);
  }

  /** Admin cancel from the meetings page — scoped to the host's own bookings. */
  async adminCancel(hostId: string, id: string): Promise<BookingWithRelations> {
    const booking = await this.bookings.findByIdForHost(id, hostId);
    if (!booking) throw new NotFoundError('Booking not found');
    return this.cancel(id, {});
  }
}
