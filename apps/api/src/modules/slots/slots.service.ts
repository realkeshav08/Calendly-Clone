import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import {
  generateAvailableSlotsForDate,
  type SlotSchedule,
  type ExistingBooking,
} from '../../utils/slots';
import { utcToZonedDateString } from '../../utils/timezone';

/**
 * Resolves the public booking context: the host user, the active event type for
 * the given slug, and the availability schedule that applies (the event's own
 * schedule, falling back to the user's default). Throws 404 if any piece is
 * missing or the event is inactive.
 */
export async function resolveBookingContext(username: string, eventSlug: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new NotFoundError('Host not found');

  const eventType = await prisma.eventType.findFirst({
    where: { userId: user.id, slug: eventSlug, isActive: true },
    include: { customQuestions: { orderBy: { order: 'asc' } } },
  });
  if (!eventType) throw new NotFoundError('Event type not found');

  // Use the event's assigned schedule, else the user's default schedule.
  const schedule = await prisma.availabilitySchedule.findFirst({
    where: eventType.scheduleId
      ? { id: eventType.scheduleId }
      : { userId: user.id, isDefault: true },
    include: { weeklyHours: true, dateOverrides: true },
  });
  if (!schedule) throw new NotFoundError('No availability schedule configured for this event');

  return { user, eventType, schedule };
}

/** Maps a Prisma schedule (with relations) into the pure SlotSchedule shape. */
function toSlotSchedule(schedule: {
  timezone: string;
  weeklyHours: { dayOfWeek: number; startTime: string; endTime: string }[];
  dateOverrides: {
    date: Date;
    isUnavailable: boolean;
    startTime: string | null;
    endTime: string | null;
  }[];
}): SlotSchedule {
  return {
    timezone: schedule.timezone,
    weeklyHours: schedule.weeklyHours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    })),
    dateOverrides: schedule.dateOverrides.map((o) => ({
      // DateOverride.date is a @db.Date stored at UTC midnight; format as YYYY-MM-DD.
      date: o.date.toISOString().slice(0, 10),
      isUnavailable: o.isUnavailable,
      startTime: o.startTime,
      endTime: o.endTime,
    })),
  };
}

/** Fetches the host's non-cancelled bookings overlapping a UTC window. */
async function getHostBookingsBetween(
  hostId: string,
  fromUtc: Date,
  toUtc: Date,
): Promise<ExistingBooking[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      hostId,
      status: { not: 'CANCELLED' },
      startTime: { lt: toUtc },
      endTime: { gt: fromUtc },
    },
    select: { startTime: true, endTime: true },
  });
  return bookings;
}

/**
 * Returns bookable start times (UTC ISO strings) for one invitee-facing date.
 * `date` is YYYY-MM-DD in `inviteeTimezone`.
 */
export async function getAvailableSlots(
  username: string,
  eventSlug: string,
  date: string,
  inviteeTimezone: string,
): Promise<string[]> {
  const { user, eventType, schedule } = await resolveBookingContext(username, eventSlug);

  // Pull bookings across a generous ±1 day window so cross-timezone slots that
  // bleed into adjacent UTC days are still checked for conflicts.
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const from = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  const to = new Date(dayStart.getTime() + 48 * 60 * 60 * 1000);
  const existingBookings = await getHostBookingsBetween(user.id, from, to);

  return generateAvailableSlotsForDate({
    eventType,
    schedule: toSlotSchedule(schedule),
    date,
    inviteeTimezone,
    existingBookings,
  });
}

/**
 * For a calendar month, returns a map of YYYY-MM-DD → boolean indicating whether
 * that day has at least one bookable slot. Powers the calendar's available-date
 * dots without forcing the client to probe each day individually.
 */
export async function getMonthAvailability(
  username: string,
  eventSlug: string,
  month: string, // "YYYY-MM"
  inviteeTimezone: string,
): Promise<Record<string, boolean>> {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new BadRequestError('month must be in YYYY-MM format');
  const { user, eventType, schedule } = await resolveBookingContext(username, eventSlug);
  const slotSchedule = toSlotSchedule(schedule);

  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();

  // Fetch the whole month's bookings once (with padding), then reuse per day.
  const from = new Date(Date.UTC(year, mon - 1, 1));
  const to = new Date(Date.UTC(year, mon, 1));
  const existingBookings = await getHostBookingsBetween(
    user.id,
    new Date(from.getTime() - 24 * 60 * 60 * 1000),
    new Date(to.getTime() + 24 * 60 * 60 * 1000),
  );

  const result: Record<string, boolean> = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    const slots = generateAvailableSlotsForDate({
      eventType,
      schedule: slotSchedule,
      date: dateStr,
      inviteeTimezone,
      existingBookings,
    });
    result[dateStr] = slots.length > 0;
  }
  return result;
}

/** Public-safe event details for the booking page left panel. */
export async function getPublicEvent(username: string, eventSlug: string) {
  const { user, eventType } = await resolveBookingContext(username, eventSlug);
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

export { utcToZonedDateString };
