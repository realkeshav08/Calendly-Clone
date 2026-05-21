import { z } from 'zod';
import { isoDate, ianaTimezone } from 'shared';

/** Query for the per-day slots endpoint. */
export const slotsQuerySchema = z.object({
  date: isoDate,
  timezone: ianaTimezone,
});

/** Query for the month-availability endpoint. */
export const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'),
  timezone: ianaTimezone,
});
