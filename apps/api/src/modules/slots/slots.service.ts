import { NotFoundError, BadRequestError } from '../../lib/errors';
import { generateAvailableSlotsForDate, type SlotSchedule } from '../../utils/slots';
import type { IUserRepository } from '../../repositories/user.repository';
import type {
  IEventTypeRepository,
  EventTypeWithQuestions,
} from '../../repositories/eventType.repository';
import type {
  IScheduleRepository,
  ScheduleWithRelations,
} from '../../repositories/schedule.repository';
import type { IBookingRepository } from '../../repositories/booking.repository';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface BookingContext {
  user: { id: string; name: string; username: string; timezone: string };
  eventType: EventTypeWithQuestions;
  schedule: ScheduleWithRelations;
}

/**
 * Read-side service for the public booking experience: resolving an event by its
 * public URL, and computing available slots / month availability. The pure slot
 * algorithm lives in utils/slots.ts (kept a pure function so it's deterministic and
 * unit-tested in isolation); this class supplies it with data via the repositories.
 */
export class SlotService {
  constructor(
    private readonly users: IUserRepository,
    private readonly eventTypes: IEventTypeRepository,
    private readonly schedules: IScheduleRepository,
    private readonly bookings: IBookingRepository,
  ) {}

  /**
   * Resolves the host, the active event for `eventSlug`, and the schedule that
   * applies (the event's own schedule, else the host's default). Throws 404 if any
   * piece is missing or the event is inactive.
   */
  async resolveContext(username: string, eventSlug: string): Promise<BookingContext> {
    const user = await this.users.findByUsername(username);
    if (!user) throw new NotFoundError('Host not found');

    const eventType = await this.eventTypes.findActiveBySlug(user.id, eventSlug);
    if (!eventType) throw new NotFoundError('Event type not found');

    const schedule = eventType.scheduleId
      ? await this.schedules.findById(eventType.scheduleId)
      : await this.schedules.findDefaultForUser(user.id);
    if (!schedule) throw new NotFoundError('No availability schedule configured for this event');

    return { user, eventType, schedule };
  }

  /** Maps a persisted schedule into the pure algorithm's input shape. */
  private toSlotSchedule(schedule: ScheduleWithRelations): SlotSchedule {
    return {
      timezone: schedule.timezone,
      weeklyHours: schedule.weeklyHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
      })),
      dateOverrides: schedule.dateOverrides.map((o) => ({
        date: o.date.toISOString().slice(0, 10),
        isUnavailable: o.isUnavailable,
        startTime: o.startTime,
        endTime: o.endTime,
      })),
    };
  }

  /** Bookable start times (UTC ISO) for one invitee-facing date. */
  async getAvailableSlots(
    username: string,
    eventSlug: string,
    date: string,
    inviteeTimezone: string,
  ): Promise<string[]> {
    const { user, eventType, schedule } = await this.resolveContext(username, eventSlug);
    // ±1 day window so cross-timezone slots bleeding into adjacent UTC days are checked.
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const existing = await this.bookings.findHostIntervalsBetween(
      user.id,
      new Date(dayStart.getTime() - DAY_MS),
      new Date(dayStart.getTime() + 2 * DAY_MS),
    );
    return generateAvailableSlotsForDate({
      eventType,
      schedule: this.toSlotSchedule(schedule),
      date,
      inviteeTimezone,
      existingBookings: existing,
    });
  }

  /** Map of YYYY-MM-DD → hasSlots for the calendar's available-day indicators. */
  async getMonthAvailability(
    username: string,
    eventSlug: string,
    month: string,
    inviteeTimezone: string,
  ): Promise<Record<string, boolean>> {
    if (!/^\d{4}-\d{2}$/.test(month)) throw new BadRequestError('month must be in YYYY-MM format');
    const { user, eventType, schedule } = await this.resolveContext(username, eventSlug);
    const slotSchedule = this.toSlotSchedule(schedule);

    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
    const existing = await this.bookings.findHostIntervalsBetween(
      user.id,
      new Date(Date.UTC(year, mon - 1, 1) - DAY_MS),
      new Date(Date.UTC(year, mon, 1) + DAY_MS),
    );

    const result: Record<string, boolean> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      result[dateStr] =
        generateAvailableSlotsForDate({
          eventType,
          schedule: slotSchedule,
          date: dateStr,
          inviteeTimezone,
          existingBookings: existing,
        }).length > 0;
    }
    return result;
  }

  /** Public-safe event details for the booking page left panel. */
  async getPublicEvent(username: string, eventSlug: string) {
    const { user, eventType } = await this.resolveContext(username, eventSlug);
    return {
      host: { name: user.name, username: user.username, timezone: user.timezone },
      eventType: {
        id: eventType.id,
        title: eventType.title,
        slug: eventType.slug,
        description: eventType.description,
        durationMinutes: eventType.durationMinutes,
        color: eventType.color,
        customQuestions: eventType.customQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          isRequired: q.isRequired,
          order: q.order,
        })),
      },
    };
  }

  /** Host landing page: profile + active event types. */
  async getPublicProfile(username: string) {
    const user = await this.users.findByUsernameWithActiveEvents(username);
    if (!user) throw new NotFoundError('Host not found');
    return {
      host: { name: user.name, username: user.username, timezone: user.timezone },
      eventTypes: user.eventTypes,
    };
  }
}
