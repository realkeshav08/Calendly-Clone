import { z } from 'zod';
import { ianaTimezone, slug } from './primitives';

/** Fields the demo user can edit about themselves. */
export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  username: slug.optional(),
  timezone: ianaTimezone.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
