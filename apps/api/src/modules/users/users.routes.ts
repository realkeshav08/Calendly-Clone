import { Router } from 'express';
import { updateUserSchema } from 'shared';
import { validate } from '../../middleware/validate';
import * as controller from './users.controller';

/** Routes for the current user's own profile. Mounted at /api/me. */
export const usersRouter = Router();

usersRouter.get('/', controller.getMe);
usersRouter.patch('/', validate(updateUserSchema), controller.updateMe);
