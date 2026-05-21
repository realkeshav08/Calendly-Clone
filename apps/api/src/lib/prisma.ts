import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env';

/**
 * A single PrismaClient instance shared across the app. In development, `tsx watch`
 * reloads modules on every change; caching the client on `globalThis` prevents a
 * connection-pool leak from spawning a new client per reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['error'] : ['warn', 'error'],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
