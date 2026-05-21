import type { Request, Response, NextFunction } from 'express';
import * as service from './slots.service';

/** GET /api/public/:username — host profile + active event types. */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getPublicProfile(req.params.username));
  } catch (err) {
    next(err);
  }
}

/** GET /api/public/:username/:eventSlug — public event details. */
export async function getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, eventSlug } = req.params;
    res.json(await service.getPublicEvent(username, eventSlug));
  } catch (err) {
    next(err);
  }
}

/** GET /api/public/:username/:eventSlug/slots?date=YYYY-MM-DD&timezone=IANA */
export async function getSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, eventSlug } = req.params;
    // Query was validated by slotsQuerySchema, so these are guaranteed strings.
    const { date, timezone } = req.query as { date: string; timezone: string };
    res.json(await service.getAvailableSlots(username, eventSlug, date, timezone));
  } catch (err) {
    next(err);
  }
}

/** GET /api/public/:username/:eventSlug/month-availability?month=YYYY-MM&timezone=IANA */
export async function getMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, eventSlug } = req.params;
    const { month, timezone } = req.query as { month: string; timezone: string };
    res.json(await service.getMonthAvailability(username, eventSlug, month, timezone));
  } catch (err) {
    next(err);
  }
}
