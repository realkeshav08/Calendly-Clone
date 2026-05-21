import { z } from 'zod';
import { ianaTimezone, timeOfDay, isoDate } from './primitives';

/**
 * One availability window within a single day of the week.
 * `endTime` must be strictly after `startTime` (validated on the parent array).
 */
export const weeklyHourInputSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: timeOfDay,
    endTime: timeOfDay,
  })
  .refine((h) => h.startTime < h.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required').max(80),
  timezone: ianaTimezone,
  isDefault: z.boolean().default(false),
  weeklyHours: z.array(weeklyHourInputSchema).max(50).default([]),
});

/**
 * Update uses replace-all semantics for `weeklyHours`: the provided array fully
 * replaces existing windows for the schedule. This keeps the editor simple — the
 * client sends the full desired state rather than diffing rows.
 */
export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  timezone: ianaTimezone.optional(),
  isDefault: z.boolean().optional(),
  weeklyHours: z.array(weeklyHourInputSchema).max(50).optional(),
});

/** A one-off override for a specific calendar date (e.g. a holiday or special hours). */
export const dateOverrideInputSchema = z
  .object({
    date: isoDate,
    isUnavailable: z.boolean().default(false),
    startTime: timeOfDay.optional().nullable(),
    endTime: timeOfDay.optional().nullable(),
  })
  .refine((o) => o.isUnavailable || (o.startTime != null && o.endTime != null), {
    message: 'Provide start and end times unless the day is marked unavailable',
    path: ['startTime'],
  })
  .refine((o) => o.isUnavailable || !o.startTime || !o.endTime || o.startTime < o.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type WeeklyHourInput = z.infer<typeof weeklyHourInputSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type DateOverrideInput = z.infer<typeof dateOverrideInputSchema>;
