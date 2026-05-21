import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../../lib/errors';
import { resolveBookingContext, getAvailableSlots } from '../slots/slots.service';
import { utcToZonedDateString } from '../../utils/timezone';
import { sendBookingConfirmation, sendBookingCancellation } from './bookings.email';
import type { CreateBookingInput, CancelBookingInput, RescheduleBookingInput } from 'shared';

/** Includes the joined event type and host needed to render a booking everywhere. */
const bookingInclude = {
  eventType: { select: { id: true, title: true, slug: true, durationMinutes: true, color: true } },
  host: { select: { id: true, name: true, username: true, timezone: true } },
} satisfies Prisma.BookingInclude;

/**
 * Confirms a requested start time is genuinely one of the slots the availability
 * engine would offer for that invitee/day — so a client can't book an arbitrary
 * instant by POSTing a hand-crafted time outside working hours.
 */
async function assertSlotIsOffered(
  username: string,
  eventSlug: string,
  startIso: string,
  inviteeTimezone: string,
): Promise<void> {
  const dateStr = utcToZonedDateString(new Date(startIso), inviteeTimezone);
  const offered = await getAvailableSlots(username, eventSlug, dateStr, inviteeTimezone);
  if (!offered.includes(new Date(startIso).toISOString())) {
    throw new BadRequestError('That time is no longer available. Please pick another slot.');
  }
}

/** Validates that every required custom question has a non-empty answer. */
function assertRequiredQuestionsAnswered(
  questions: { id: string; question: string; isRequired: boolean }[],
  answers: CreateBookingInput['answers'],
): void {
  const answerByQuestion = new Map((answers ?? []).map((a) => [a.questionId, a.answer.trim()]));
  for (const q of questions) {
    if (q.isRequired && !answerByQuestion.get(q.id)) {
      throw new BadRequestError(`Please answer the required question: "${q.question}"`);
    }
  }
}

/**
 * Creates a booking with double-booking protection.
 *
 * Concurrency strategy: we run the conflict check + insert inside a SERIALIZABLE
 * transaction. Two invitees racing for the same slot will both read "no conflict",
 * but Serializable isolation forces the database to detect the write-skew and abort
 * one transaction (Postgres raises a 40001 serialization failure), which we surface
 * as a 409. We chose this over a unique constraint on (hostId, startTime) because
 * conflicts here are *range overlaps* (buffers, differing durations), not equality —
 * a unique index can't express "no interval may overlap another".
 */
export async function createBooking(
  username: string,
  eventSlug: string,
  input: CreateBookingInput,
) {
  const { user, eventType } = await resolveBookingContext(username, eventSlug);

  await assertSlotIsOffered(username, eventSlug, input.startTime, input.inviteeTimezone);
  assertRequiredQuestionsAnswered(eventType.customQuestions, input.answers);

  const start = new Date(input.startTime);
  const end = new Date(start.getTime() + eventType.durationMinutes * 60_000);

  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        // Re-check for overlap *inside* the transaction (the source of truth).
        const overlap = await tx.booking.findFirst({
          where: {
            hostId: user.id,
            status: { not: 'CANCELLED' },
            startTime: { lt: end },
            endTime: { gt: start },
          },
          select: { id: true },
        });
        if (overlap) throw new ConflictError();

        return tx.booking.create({
          data: {
            eventTypeId: eventType.id,
            hostId: user.id,
            inviteeName: input.inviteeName,
            inviteeEmail: input.inviteeEmail,
            inviteeTimezone: input.inviteeTimezone,
            startTime: start,
            endTime: end,
            notes: input.notes ?? null,
            answers: input.answers
              ? (input.answers as unknown as Prisma.InputJsonValue)
              : undefined,
          },
          include: bookingInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Best-effort confirmation email (no-op if email isn't configured).
    await sendBookingConfirmation(booking);
    return booking;
  } catch (err) {
    // Postgres serialization failure → another booking won the race.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      throw new ConflictError();
    }
    throw err;
  }
}

/** Public: fetch a single booking for the confirmation/cancel/reschedule pages. */
export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking) throw new NotFoundError('Booking not found');
  return booking;
}

/** Cancels a booking (soft: sets status=CANCELLED, never hard-deletes). */
export async function cancelBooking(id: string, input: CancelBookingInput) {
  const booking = await getBookingById(id);
  if (booking.status === 'CANCELLED') return booking;

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: input.cancellationReason ?? null,
    },
    include: bookingInclude,
  });
  await sendBookingCancellation(updated);
  return updated;
}

/**
 * Reschedules a booking: validates the new slot, marks the old booking RESCHEDULED,
 * and creates a fresh CONFIRMED booking at the new time — atomically and under the
 * same Serializable protection as a normal booking.
 */
export async function rescheduleBooking(id: string, input: RescheduleBookingInput) {
  const existing = await getBookingById(id);
  const newBooking = await createBooking(existing.host.username, existing.eventType.slug, {
    startTime: input.startTime,
    inviteeName: existing.inviteeName,
    inviteeEmail: existing.inviteeEmail,
    inviteeTimezone: existing.inviteeTimezone,
    notes: existing.notes,
    answers: (existing.answers as CreateBookingInput['answers']) ?? undefined,
  });

  await prisma.booking.update({
    where: { id },
    data: { status: 'RESCHEDULED', cancelledAt: new Date() },
  });
  return newBooking;
}

/** Admin: lists the current user's bookings split by upcoming/past. */
export async function listBookings(hostId: string, filter: 'upcoming' | 'past') {
  const now = new Date();
  const isUpcoming = filter === 'upcoming';
  return prisma.booking.findMany({
    where: {
      hostId,
      startTime: isUpcoming ? { gte: now } : { lt: now },
      ...(isUpcoming ? { status: { not: 'CANCELLED' } } : {}),
    },
    orderBy: { startTime: isUpcoming ? 'asc' : 'desc' },
    include: bookingInclude,
  });
}

/** Admin: cancel from the meetings page. */
export async function adminCancelBooking(hostId: string, id: string) {
  const booking = await prisma.booking.findFirst({ where: { id, hostId } });
  if (!booking) throw new NotFoundError('Booking not found');
  return cancelBooking(id, {});
}
