import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env, isProduction } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { currentUser } from './middleware/currentUser';
import { usersRouter } from './modules/users/users.routes';
import { eventTypesRouter } from './modules/eventTypes/eventTypes.routes';
import { schedulesRouter } from './modules/availability/availability.routes';
import { bookingsRouter } from './modules/bookings/bookings.routes';
import { publicRouter } from './modules/slots/public.routes';

/**
 * Builds the Express application. Kept separate from the listen() call in index.ts
 * so tests (or a serverless adapter) can import the configured app without binding
 * a port.
 */
export function createApp(): Express {
  const app = express();

  // Render (and most PaaS) put the app behind a reverse proxy. Trusting the first
  // hop lets express-rate-limit and req.ip read the real client IP from
  // X-Forwarded-For instead of rate-limiting every user as one proxy address.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      // In production lock CORS to the deployed frontend(s); in dev allow any origin.
      origin: isProduction ? env.FRONTEND_URL.split(',').map((o) => o.trim()) : true,
      credentials: true,
    }),
  );
  // Cap request bodies — booking/event payloads are tiny, so a small limit blunts
  // memory-exhaustion attempts via oversized JSON.
  app.use(express.json({ limit: '64kb' }));
  app.use(pinoHttp({ logger }));

  // Liveness probe for Render / uptime checks.
  app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // Public, unauthenticated invitee routes.
  app.use('/api/public', publicRouter);

  // Admin routes share the stubbed currentUser middleware (the single auth seam).
  app.use('/api/me', currentUser, usersRouter);
  app.use('/api/event-types', currentUser, eventTypesRouter);
  app.use('/api/schedules', currentUser, schedulesRouter);
  app.use('/api/bookings', currentUser, bookingsRouter);

  // 404 for unmatched API routes.
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler);
  return app;
}
