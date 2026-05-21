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

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10, // 10 booking attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
});

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

// Booking lifecycle (public, via shareable links).
publicRouter.post(
  '/:username/:eventSlug/book',
  bookingLimiter,
  validate(createBookingSchema),
  bookings.book,
);
publicRouter.get('/bookings/:id', bookings.getOne);
publicRouter.post('/bookings/:id/cancel', validate(cancelBookingSchema), bookings.cancel);
publicRouter.post(
  '/bookings/:id/reschedule',
  bookingLimiter,
  validate(rescheduleBookingSchema),
  bookings.reschedule,
);
