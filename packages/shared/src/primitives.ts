import { z } from 'zod';
import { TIME_OF_DAY_REGEX } from './constants';

/**
 * Validates an IANA timezone identifier (e.g. "Asia/Kolkata", "America/New_York")
 * by asking the runtime's Intl engine to construct a formatter with it. Any string
 * the platform doesn't recognize throws a RangeError, which we map to a Zod issue.
 *
 * We validate at the boundary rather than maintaining a hardcoded list so the app
 * stays correct as the IANA database evolves.
 */
export const ianaTimezone = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid IANA timezone' },
);

/** A 24-hour time-of-day string like "09:00" or "17:30". */
export const timeOfDay = z
  .string()
  .regex(TIME_OF_DAY_REGEX, 'Time must be in HH:mm 24-hour format');

/** A calendar date in YYYY-MM-DD form (no time component). */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/** A URL-safe slug: lowercase letters, numbers, and hyphens. */
export const slug = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens');
