import { formatInTimeZone } from 'date-fns-tz';

/**
 * All display-time conversions live here. The API returns UTC ISO strings; the UI
 * renders them in a chosen timezone via date-fns-tz so DST and half-hour offsets
 * are always correct.
 */

/** The viewer's IANA timezone, auto-detected from the browser. */
export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Formats a UTC ISO instant as a 12-hour time (e.g. "12:30pm") in a timezone. */
export function formatSlotTime(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, 'h:mmaaa');
}

/** Formats a UTC ISO instant as a time range ("12:30pm – 1:00pm") in a timezone. */
export function formatTimeRange(startIso: string, endIso: string, timezone: string): string {
  return `${formatSlotTime(startIso, timezone)} – ${formatSlotTime(endIso, timezone)}`;
}

/** Long human date, e.g. "Wednesday, March 12, 2026", in a timezone. */
export function formatLongDate(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, 'EEEE, MMMM d, yyyy');
}

/** Full date + time used on the confirmation page. */
export function formatDateTime(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, 'h:mmaaa, EEEE, MMMM d, yyyy');
}

/** "YYYY-MM-DD" for a Date as seen in a timezone — used to key calendar days. */
export function toDateKey(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

/** Builds a "YYYY-MM-DD" key from explicit calendar parts (no timezone math). */
export function dateKeyFromParts(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
