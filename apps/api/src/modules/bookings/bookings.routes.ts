import { Router } from 'express';
import * as controller from './bookings.controller';

/** Admin meetings page routes. Mounted at /api/bookings (behind currentUser). */
export const bookingsRouter = Router();

bookingsRouter.get('/', controller.list);
bookingsRouter.delete('/:id', controller.adminCancel);
