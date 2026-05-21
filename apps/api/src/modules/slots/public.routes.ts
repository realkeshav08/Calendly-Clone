import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createBookingSchema, cancelBookingSchema, rescheduleBookingSchema } from 'shared';
import { validate } from '../../middleware/validate';
import { slotsQuerySchema, monthQuerySchema } from './slots.schemas';
import * as slots from './slots.controller';
import * as bookings from '../bookings/bookings.controller';

/**
 * All unauthenticated, invitee-facing routes. Mounted at /api/public.
 * Booking writes are rate-limited to blunt abuse of the public endpoint.
 */
export const publicRouter = Router();

const rateLimited = { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' };

/** Stricter limit on writes (booking/reschedule) to deter abuse of the open endpoint. */
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10, // 10 booking attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: rateLimited },
});

/**
 * General limit on all public reads. month-availability runs ~31 slot computations
 * per request, so an unauthenticated client shouldn't be able to hammer it freely.
 */
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: rateLimited },
});

// Applies to every public route; booking writes additionally pass bookingLimiter.
publicRouter.use(readLimiter);

// Booking lifecycle (public, via shareable links). Registered FIRST: the literal
// "bookings" prefix must win over the `/:username/...` param routes below, which
// would otherwise capture "bookings" as a username.
publicRouter.get('/bookings/:id', bookings.getOne);
publicRouter.post('/bookings/:id/cancel', validate(cancelBookingSchema), bookings.cancel);
publicRouter.post(
  '/bookings/:id/reschedule',
  bookingLimiter,
  validate(rescheduleBookingSchema),
  bookings.reschedule,
);

// Host profile + event details + availability.
publicRouter.get('/:username', slots.getProfile);
publicRouter.get('/:username/:eventSlug', slots.getEvent);
publicRouter.get(
  '/:username/:eventSlug/slots',
  validate(slotsQuerySchema, 'query'),
  slots.getSlots,
);
publicRouter.get(
  '/:username/:eventSlug/month-availability',
  validate(monthQuerySchema, 'query'),
  slots.getMonth,
);
publicRouter.post(
  '/:username/:eventSlug/book',
  bookingLimiter,
  validate(createBookingSchema),
  bookings.book,
);
