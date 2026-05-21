import { z } from 'zod';
import { slug } from './primitives';

/** A single custom question shown on the booking form. */
export const customQuestionInputSchema = z.object({
  question: z.string().min(1, 'Question text is required').max(200),
  isRequired: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

/**
 * Fields a user may set when creating an event type. `durationMinutes` is bounded
 * to keep generated slot counts sane; buffers are non-negative.
 */
export const createEventTypeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  slug,
  description: z.string().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480),
  bufferBeforeMins: z.number().int().min(0).max(240).default(0),
  bufferAfterMins: z.number().int().min(0).max(240).default(0),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #0069ff')
    .optional(),
  isActive: z.boolean().default(true),
  scheduleId: z.string().cuid().optional().nullable(),
  customQuestions: z.array(customQuestionInputSchema).max(20).optional(),
});

/** All event-type fields are optional on update (partial PATCH semantics). */
export const updateEventTypeSchema = createEventTypeSchema.partial();

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>;
export type UpdateEventTypeInput = z.infer<typeof updateEventTypeSchema>;
export type CustomQuestionInput = z.infer<typeof customQuestionInputSchema>;
