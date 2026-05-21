import { NotFoundError } from '../../lib/errors';
import type {
  IScheduleRepository,
  ScheduleWithRelations,
} from '../../repositories/schedule.repository';
import type { CreateScheduleInput, UpdateScheduleInput, DateOverrideInput } from 'shared';

/**
 * Availability use cases. Ownership is enforced here (a user may only touch their
 * own schedules); the repository owns the transactional details of replace-all
 * weekly hours and single-default invariants.
 */
export class AvailabilityService {
  constructor(private readonly schedules: IScheduleRepository) {}

  list(userId: string): Promise<ScheduleWithRelations[]> {
    return this.schedules.findManyByUser(userId);
  }

  async getForUser(userId: string, id: string): Promise<ScheduleWithRelations> {
    const schedule = await this.schedules.findByIdForUser(id, userId);
    if (!schedule) throw new NotFoundError('Schedule not found');
    return schedule;
  }

  create(userId: string, input: CreateScheduleInput): Promise<ScheduleWithRelations> {
    const { weeklyHours, ...fields } = input;
    return this.schedules.create(userId, fields, weeklyHours);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateScheduleInput,
  ): Promise<ScheduleWithRelations> {
    await this.getForUser(userId, id); // ownership check
    const { weeklyHours, ...fields } = input;
    return this.schedules.update(id, userId, fields, weeklyHours);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.getForUser(userId, id); // ownership check
    await this.schedules.delete(id);
  }

  async addOverride(userId: string, scheduleId: string, input: DateOverrideInput): Promise<void> {
    await this.getForUser(userId, scheduleId); // ownership check
    await this.schedules.upsertOverride(scheduleId, input);
  }

  async removeOverride(userId: string, scheduleId: string, overrideId: string): Promise<void> {
    await this.getForUser(userId, scheduleId); // ownership check
    await this.schedules.deleteOverride(scheduleId, overrideId);
  }
}
