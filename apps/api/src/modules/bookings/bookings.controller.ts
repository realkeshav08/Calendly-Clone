import type { Request, Response, NextFunction } from 'express';
import { container } from '../../container';

const service = container.bookingService;

/** Public: POST /api/public/:username/:eventSlug/book */
export async function book(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, eventSlug } = req.params;
    res.status(201).json(await service.create(username, eventSlug, req.body));
  } catch (err) {
    next(err);
  }
}

/** Public: GET /api/public/bookings/:id */
export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getById(req.params.id));
  } catch (err) {
    next(err);
  }
}

/** Public: POST /api/public/bookings/:id/cancel */
export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.cancel(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

/** Public: POST /api/public/bookings/:id/reschedule */
export async function reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.reschedule(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

/** Admin: GET /api/bookings?filter=upcoming|past */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter = req.query.filter === 'past' ? 'past' : 'upcoming';
    res.json(await service.listForHost(req.user.id, filter));
  } catch (err) {
    next(err);
  }
}

/** Admin: DELETE /api/bookings/:id (soft-cancel) */
export async function adminCancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.adminCancel(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}
