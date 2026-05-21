import { Router } from 'express';
import { createScheduleSchema, updateScheduleSchema, dateOverrideInputSchema } from 'shared';
import { validate } from '../../middleware/validate';
import * as controller from './availability.controller';

/** Admin CRUD for availability schedules. Mounted at /api/schedules. */
export const schedulesRouter = Router();

schedulesRouter.get('/', controller.list);
schedulesRouter.post('/', validate(createScheduleSchema), controller.create);
schedulesRouter.get('/:id', controller.getOne);
schedulesRouter.patch('/:id', validate(updateScheduleSchema), controller.update);
schedulesRouter.delete('/:id', controller.remove);

schedulesRouter.post(
  '/:id/date-overrides',
  validate(dateOverrideInputSchema),
  controller.addOverride,
);
schedulesRouter.delete('/:id/date-overrides/:overrideId', controller.removeOverride);
