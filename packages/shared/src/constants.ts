/**
 * Shared constants used by both the API and web app.
 * Keeping these in one place avoids drift between client and server.
 */

/** Calendly's brand blue — used as the default event color. */
export const DEFAULT_EVENT_COLOR = '#0069ff';

/** Default timezone for newly seeded users (assignment targets an India-based demo). */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/** Booking lifecycle states. Mirrors the Prisma `BookingStatus` enum. */
export const BOOKING_STATUSES = ['CONFIRMED', 'CANCELLED', 'RESCHEDULED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** 0 = Sunday … 6 = Saturday, matching JS `Date.getDay()` and the schema. */
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
export const DAY_LABELS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** Allowed event durations offered in the UI (minutes). */
export const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;

/** Matches a 24-hour "HH:mm" time-of-day string. */
export const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
