import 'dotenv/config';
import { z } from 'zod';

/**
 * Validates process.env at startup so the app fails fast with a clear message
 * if a required variable is missing or malformed — rather than throwing deep
 * inside a request handler later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid Postgres connection string'),
  /** The seeded demo user. The currentUser middleware attaches this user to every admin request. */
  DEFAULT_USER_ID: z.string().min(1, 'DEFAULT_USER_ID is required (the seeded demo user id)'),
  /** Comma-separated list of allowed origins for CORS in production. */
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  /** Optional — email is a graceful no-op when unset. */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
