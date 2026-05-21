import { z } from 'zod';
import { ianaTimezone } from './primitives';

/** A single answer to a custom question, keyed by the question's id. */
export const bookingAnswerSchema = z.object({
  questionId: z.string().max(40),
  question: z.string().max(200),
  answer: z.string().max(2000),
});

/**
 * Payload for creating a public booking. `startTime` is an absolute instant
 * (ISO 8601, UTC) chosen from the slots the API offered; the server recomputes
 * `endTime` from the event duration rather than trusting the client.
 */
export const createBookingSchema = z.object({
  startTime: z.string().datetime({ message: 'startTime must be an ISO 8601 datetime' }),
  inviteeName: z.string().min(1, 'Name is required').max(120),
  inviteeEmail: z.string().email('Enter a valid email'),
  inviteeTimezone: ianaTimezone,
  notes: z.string().max(2000).optional().nullable(),
  answers: z.array(bookingAnswerSchema).max(20).optional(),
});

export const cancelBookingSchema = z.object({
  cancellationReason: z.string().max(500).optional().nullable(),
});

/** Reschedule reuses a new start time; the old booking is marked RESCHEDULED. */
export const rescheduleBookingSchema = z.object({
  startTime: z.string().datetime({ message: 'startTime must be an ISO 8601 datetime' }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type BookingAnswer = z.infer<typeof bookingAnswerSchema>;
