import { NotFoundError, ConflictError } from '../../lib/errors';
import type {
  IEventTypeRepository,
  EventTypeWithQuestions,
} from '../../repositories/eventType.repository';
import type { IBookingRepository } from '../../repositories/booking.repository';
import type { CreateEventTypeInput, UpdateEventTypeInput } from 'shared';

/**
 * Event-type use cases. Collaborates with two repositories: its own for CRUD and
 * the booking repository to enforce the rule that an event type with bookings can't
 * be hard-deleted. Both are injected as interfaces (DIP).
 */
export class EventTypeService {
  constructor(
    private readonly eventTypes: IEventTypeRepository,
    private readonly bookings: IBookingRepository,
  ) {}

  list(userId: string): Promise<EventTypeWithQuestions[]> {
    return this.eventTypes.findManyByUser(userId);
  }

  /** Fetches an event type scoped to its owner; throws 404 if it isn't theirs. */
  async getForUser(userId: string, id: string): Promise<EventTypeWithQuestions> {
    const eventType = await this.eventTypes.findByIdForUser(id, userId);
    if (!eventType) throw new NotFoundError('Event type not found');
    return eventType;
  }

  create(userId: string, input: CreateEventTypeInput): Promise<EventTypeWithQuestions> {
    const { customQuestions, scheduleId, ...fields } = input;
    return this.eventTypes.create(
      userId,
      { ...fields, schedule: scheduleId ? { connect: { id: scheduleId } } : undefined },
      customQuestions,
    );
  }

  async update(
    userId: string,
    id: string,
    input: UpdateEventTypeInput,
  ): Promise<EventTypeWithQuestions> {
    await this.getForUser(userId, id); // ownership check
    const { customQuestions, scheduleId, ...fields } = input;
    return this.eventTypes.update(
      id,
      {
        ...fields,
        ...(scheduleId !== undefined
          ? { schedule: scheduleId ? { connect: { id: scheduleId } } : { disconnect: true } }
          : {}),
      },
      customQuestions,
    );
  }

  /**
   * Deletes an event type. Refuses if it still has bookings — deactivating
   * (isActive=false) is the right way to retire one without orphaning history.
   */
  async delete(userId: string, id: string): Promise<void> {
    await this.getForUser(userId, id); // ownership check
    const bookingCount = await this.bookings.countByEventType(id);
    if (bookingCount > 0) {
      throw new ConflictError(
        'This event type has bookings. Toggle it off to hide it instead of deleting.',
      );
    }
    await this.eventTypes.delete(id);
  }
}
