import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
import type { CreateEventTypeInput, UpdateEventTypeInput } from 'shared';

/** Event type with its custom questions ordered for display. */
const includeQuestions = {
  customQuestions: { orderBy: { order: 'asc' } },
} satisfies Prisma.EventTypeInclude;

/** Lists all of a user's event types, newest first, with question counts usable by the UI. */
export async function listEventTypes(userId: string) {
  return prisma.eventType.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: includeQuestions,
  });
}

/** Fetches one event type scoped to the owner; throws if it isn't theirs. */
export async function getEventType(userId: string, id: string) {
  const eventType = await prisma.eventType.findFirst({
    where: { id, userId },
    include: includeQuestions,
  });
  if (!eventType) throw new NotFoundError('Event type not found');
  return eventType;
}

/** Creates an event type plus any custom questions in a single nested write. */
export async function createEventType(userId: string, data: CreateEventTypeInput) {
  const { customQuestions, ...fields } = data;
  return prisma.eventType.create({
    data: {
      ...fields,
      userId,
      customQuestions: customQuestions?.length ? { create: customQuestions } : undefined,
    },
    include: includeQuestions,
  });
}

/**
 * Updates an event type. Custom questions use replace-all semantics: when an
 * `customQuestions` array is provided, the old set is deleted and recreated, so
 * the client can manage the list declaratively. Wrapped in a transaction so the
 * delete + recreate + update are atomic.
 */
export async function updateEventType(userId: string, id: string, data: UpdateEventTypeInput) {
  await getEventType(userId, id); // ownership check
  const { customQuestions, ...fields } = data;

  return prisma.$transaction(async (tx) => {
    if (customQuestions) {
      await tx.customQuestion.deleteMany({ where: { eventTypeId: id } });
      if (customQuestions.length) {
        await tx.customQuestion.createMany({
          data: customQuestions.map((q) => ({ ...q, eventTypeId: id })),
        });
      }
    }
    return tx.eventType.update({
      where: { id },
      data: fields,
      include: includeQuestions,
    });
  });
}

/**
 * Deletes an event type (cascades to its custom questions). Bookings have a
 * required FK to the event type, so we refuse to delete one that still has
 * bookings — the user should deactivate it (isActive=false) to hide it instead.
 * This keeps historical meeting records intact rather than orphaning them.
 */
export async function deleteEventType(userId: string, id: string) {
  await getEventType(userId, id); // ownership check
  const bookingCount = await prisma.booking.count({ where: { eventTypeId: id } });
  if (bookingCount > 0) {
    throw new ConflictError(
      'This event type has bookings. Toggle it off to hide it instead of deleting.',
    );
  }
  await prisma.eventType.delete({ where: { id } });
}
