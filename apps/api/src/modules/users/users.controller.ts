import type { Request, Response, NextFunction } from 'express';
import * as service from './users.service';

/** GET /api/me — returns the current (seeded) user's profile. */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getUserById(req.user.id));
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/me — updates the current user's name/username/timezone. */
export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.updateUser(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}
