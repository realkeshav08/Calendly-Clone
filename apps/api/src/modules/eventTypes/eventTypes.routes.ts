import { Router } from 'express';
import { createEventTypeSchema, updateEventTypeSchema } from 'shared';
import { validate } from '../../middleware/validate';
import * as controller from './eventTypes.controller';

/** Admin CRUD for the current user's event types. Mounted at /api/event-types. */
export const eventTypesRouter = Router();

eventTypesRouter.get('/', controller.list);
eventTypesRouter.post('/', validate(createEventTypeSchema), controller.create);
eventTypesRouter.get('/:id', controller.getOne);
eventTypesRouter.patch('/:id', validate(updateEventTypeSchema), controller.update);
eventTypesRouter.delete('/:id', controller.remove);
