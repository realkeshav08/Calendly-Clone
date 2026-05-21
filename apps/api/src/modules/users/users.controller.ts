import type { Request, Response, NextFunction } from 'express';
import { container } from '../../container';

/** GET /api/me — returns the current (seeded) user's profile. */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await container.userService.getById(req.user.id));
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/me — updates the current user's name/username/timezone. */
export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await container.userService.update(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}
