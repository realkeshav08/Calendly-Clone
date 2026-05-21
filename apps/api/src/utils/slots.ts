import { zonedWallTimeToUtc, utcToZonedDateString, dayOfWeekInTimezone } from './timezone';

/**
 * Minimal structural inputs for slot generation. Defined as plain interfaces
 * (not Prisma model types) so the algorithm is pure and trivially unit-testable
 * without a database.
 */
export interface SlotEventType {
  durationMinutes: number;
  bufferBeforeMins: number;
  bufferAfterMins: number;
}

export interface SlotWeeklyHour {
  dayOfWeek: number; // 0=Sun…6=Sat
  startTime: string; // "HH:mm" in the schedule's timezone
  endTime: string; // "HH:mm"
}

export interface SlotDateOverride {
  date: string; // "YYYY-MM-DD" in the schedule's timezone
  isUnavailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface SlotSchedule {
  timezone: string; // IANA, the timezone weekly hours are expressed in
  weeklyHours: SlotWeeklyHour[];
  dateOverrides: SlotDateOverride[];
}

/** An already-booked interval for the host, as absolute UTC instants. */
export interface ExistingBooking {
  startTime: Date;
  endTime: Date;
}

export interface GenerateSlotsParams {
  eventType: SlotEventType;
  schedule: SlotSchedule;
  /** The day the invitee is viewing, "YYYY-MM-DD" in their own timezone. */
  date: string;
  /** IANA timezone the invitee is booking from. */
  inviteeTimezone: string;
  /** The host's bookings that could overlap this day (UTC instants). */
  existingBookings: ExistingBooking[];
  /** Injectable "now" for deterministic tests. Defaults to the real current time. */
  now?: Date;
}

/** Converts "HH:mm" to minutes since midnight. */
function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/** Converts minutes since midnight back to "HH:mm" (zero-padded). */
function minutesToHm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Two intervals overlap iff each starts before the other ends. Strict `<`
 * inequalities mean intervals that merely touch at a boundary (one ends exactly
 * where the next begins) do NOT overlap — so back-to-back, zero-buffer slots are
 * allowed, matching Calendly's behavior.
 */
function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/**
 * Generates the bookable start times for a host on a given invitee-facing day.
 *
 * The hard part is timezones: availability is defined as wall-clock windows in the
 * SCHEDULE's timezone, but the invitee browses in THEIR timezone and bookings are
 * stored in UTC. We resolve everything to absolute UTC instants before comparing.
 *
 * Algorithm (see README "How slot generation works"):
 *  1. Map the invitee's selected date to the corresponding calendar day in the
 *     schedule's timezone. We anchor at noon to stay clear of midnight/DST edges.
 *  2. Resolve that day's working windows: a matching date override wins over the
 *     weekly hours; an "unavailable" override yields no slots.
 *  3. Walk each window in `durationMinutes` steps (back-to-back, not a 15-min grid),
 *     emitting a candidate while the slot still fits inside the window.
 *  4. Convert each candidate wall-clock start to a UTC instant independently — this
 *     makes DST transitions correct because each conversion re-evaluates the offset.
 *  5. Drop candidates whose [start-bufferBefore, end+bufferAfter] interval overlaps
 *     any existing booking, and drop any slot at or before `now`.
 *
 * @returns Bookable start times as UTC ISO strings, ascending. The frontend renders
 *          them in the invitee's timezone.
 */
export function generateAvailableSlotsForDate(params: GenerateSlotsParams): string[] {
  const { eventType, schedule, date, inviteeTimezone, existingBookings, now = new Date() } = params;
  const { durationMinutes, bufferBeforeMins, bufferAfterMins } = eventType;

  // Step 1: which schedule-tz day does the invitee's selected day correspond to?
  const noonInviteeInstant = zonedWallTimeToUtc(date, '12:00', inviteeTimezone);
  const scheduleDate = utcToZonedDateString(noonInviteeInstant, schedule.timezone);

  // Step 2: resolve the working windows for that schedule day.
  const windows = resolveWindowsForDay(schedule, scheduleDate);
  if (windows.length === 0) return [];

  const slots: string[] = [];

  for (const window of windows) {
    const windowStartMin = hmToMinutes(window.startTime);
    const windowEndMin = hmToMinutes(window.endTime);

    // Step 3: back-to-back candidate starts that still fit fully inside the window.
    for (let startMin = windowStartMin; startMin + durationMinutes <= windowEndMin; startMin += durationMinutes) {
      const startHm = minutesToHm(startMin);

      // Step 4: independent wall-clock → UTC conversion (DST-safe).
      const slotStartUtc = zonedWallTimeToUtc(scheduleDate, startHm, schedule.timezone);
      const slotEndUtc = new Date(slotStartUtc.getTime() + durationMinutes * 60_000);

      // Step 5a: skip slots in the past.
      if (slotStartUtc.getTime() <= now.getTime()) continue;

      // Step 5b: skip slots conflicting with a booking, padded by buffers.
      const guardedStart = new Date(slotStartUtc.getTime() - bufferBeforeMins * 60_000);
      const guardedEnd = new Date(slotEndUtc.getTime() + bufferAfterMins * 60_000);
      const conflicts = existingBookings.some((b) =>
        intervalsOverlap(guardedStart, guardedEnd, b.startTime, b.endTime),
      );
      if (conflicts) continue;

      slots.push(slotStartUtc.toISOString());
    }
  }

  // De-duplicate (overlapping windows could theoretically collide) and sort ascending.
  return Array.from(new Set(slots)).sort();
}

/**
 * Returns the working windows for a single schedule-tz calendar day. A date
 * override takes precedence over the weekly recurring hours:
 *  - override marked unavailable → no windows (the day is blocked off);
 *  - override with hours → exactly those hours;
 *  - no override → every weekly window for that day-of-week.
 */
function resolveWindowsForDay(
  schedule: SlotSchedule,
  scheduleDate: string,
): Array<{ startTime: string; endTime: string }> {
  const override = schedule.dateOverrides.find((o) => o.date === scheduleDate);
  if (override) {
    if (override.isUnavailable || !override.startTime || !override.endTime) return [];
    return [{ startTime: override.startTime, endTime: override.endTime }];
  }

  const dow = dayOfWeekInTimezone(scheduleDate, schedule.timezone);
  return schedule.weeklyHours
    .filter((h) => h.dayOfWeek === dow)
    .map((h) => ({ startTime: h.startTime, endTime: h.endTime }));
}
