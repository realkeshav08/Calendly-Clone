import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Timezone helpers built on date-fns-tz. We never do raw `Date` arithmetic for
 * timezone conversions — DST and non-integer offsets (e.g. India = UTC+5:30) make
 * that incorrect. Every conversion goes through the IANA-aware functions here.
 */

/**
 * Converts a wall-clock time in a given timezone to an absolute UTC instant.
 *
 * @param dateYmd  Calendar date as "YYYY-MM-DD" in `timezone`.
 * @param timeHm   Time of day as "HH:mm" in `timezone`.
 * @param timezone IANA timezone the wall-clock time is expressed in.
 * @returns A Date representing that instant in UTC.
 *
 * Example: ("2026-03-10", "09:00", "America/New_York") → the UTC instant that
 * reads 9am in New York on that date, accounting for whether DST is in effect.
 */
export function zonedWallTimeToUtc(dateYmd: string, timeHm: string, timezone: string): Date {
  // `fromZonedTime` interprets the given naive timestamp as local to `timezone`.
  return fromZonedTime(`${dateYmd}T${timeHm}:00`, timezone);
}

/**
 * Returns the calendar date ("YYYY-MM-DD") that a UTC instant falls on when
 * viewed in the given timezone. Used to map a UTC slot back to "which day" it is
 * for a viewer, and to align the invitee's requested day with the host's schedule.
 */
export function utcToZonedDateString(instant: Date, timezone: string): string {
  return formatInTimeZone(instant, timezone, 'yyyy-MM-dd');
}

/** Day of week (0=Sun…6=Sat) for a calendar date as seen in `timezone`. */
export function dayOfWeekInTimezone(dateYmd: string, timezone: string): number {
  // Anchor at noon to avoid any midnight/DST edge ambiguity when reading the day.
  const instant = fromZonedTime(`${dateYmd}T12:00:00`, timezone);
  return Number(formatInTimeZone(instant, timezone, 'i')) % 7; // date-fns 'i': 1=Mon…7=Sun
}

/** Re-exports kept local so callers import timezone math from one module. */
export { fromZonedTime, toZonedTime, formatInTimeZone };
