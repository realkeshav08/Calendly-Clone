import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { env } from '../config/env';

/**
 * Builds a Prisma driver adapter backed by Neon's serverless driver. The driver
 * tunnels Postgres over a WebSocket on port 443 instead of a raw TCP socket on
 * 5432 — necessary here because the dev network blocks 5432, and a good fit for
 * serverless hosts in general. In Node we must supply the WebSocket implementation.
 */
neonConfig.webSocketConstructor = ws;

export function createNeonAdapter(): PrismaNeon {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return new PrismaNeon(pool);
}
