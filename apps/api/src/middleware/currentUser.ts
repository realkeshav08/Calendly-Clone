import { NextFunction, Request, Response } from 'express';
import { container } from '../container';
import { env } from '../config/env';
import { AppError } from '../lib/errors';

/**
 * Auth is intentionally stubbed for this assignment. Instead of validating a JWT
 * or session, we load the single seeded demo user (id from DEFAULT_USER_ID) and
 * attach it to the request. This is the SINGLE integration point for real auth:
 * swap the body of this middleware for token/session validation and the rest of
 * the admin codebase — which only reads `req.user.id` — keeps working unchanged.
 */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  username: string;
  timezone: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: CurrentUser;
    }
  }
}

export async function currentUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await container.userRepository.findRawById(env.DEFAULT_USER_ID);
    if (!user) {
      throw new AppError(
        500,
        'NO_DEFAULT_USER',
        'DEFAULT_USER_ID does not match any user. Run `pnpm seed` and set the id.',
      );
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      timezone: user.timezone,
    };
    next();
  } catch (err) {
    next(err);
  }
}
