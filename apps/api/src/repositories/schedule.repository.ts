import { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import type { WeeklyHourInput, DateOverrideInput } from 'shared';

/** Full schedule with ordered hours + overrides, for the admin availability editor. */
const fullInclude = {
  weeklyHours: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
  dateOverrides: { orderBy: { date: 'asc' } },
} satisfies Prisma.AvailabilityScheduleInclude;

export type ScheduleWithRelations = Prisma.AvailabilityScheduleGetPayload<{
  include: typeof fullInclude;
}>;

export interface IScheduleRepository {
  findManyByUser(userId: string): Promise<ScheduleWithRelations[]>;
  findByIdForUser(id: string, userId: string): Promise<ScheduleWithRelations | null>;
  findById(id: string): Promise<ScheduleWithRelations | null>;
  findDefaultForUser(userId: string): Promise<ScheduleWithRelations | null>;
  create(
    userId: string,
    data: { name: string; timezone: string; isDefault: boolean },
    weeklyHours: WeeklyHourInput[],
  ): Promise<ScheduleWithRelations>;
  update(
    id: string,
    userId: string,
    data: { name?: string; timezone?: string; isDefault?: boolean },
    weeklyHours?: WeeklyHourInput[],
  ): Promise<ScheduleWithRelations>;
  delete(id: string): Promise<void>;
  upsertOverride(scheduleId: string, data: DateOverrideInput): Promise<void>;
  deleteOverride(scheduleId: string, overrideId: string): Promise<void>;
}

export class ScheduleRepository extends BaseRepository implements IScheduleRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  findManyByUser(userId: string): Promise<ScheduleWithRelations[]> {
    return this.prisma.availabilitySchedule.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: fullInclude,
    });
  }

  findByIdForUser(id: string, userId: string): Promise<ScheduleWithRelations | null> {
    return this.prisma.availabilitySchedule.findFirst({
      where: { id, userId },
      include: fullInclude,
    });
  }

  findById(id: string): Promise<ScheduleWithRelations | null> {
    return this.prisma.availabilitySchedule.findUnique({ where: { id }, include: fullInclude });
  }

  findDefaultForUser(userId: string): Promise<ScheduleWithRelations | null> {
    return this.prisma.availabilitySchedule.findFirst({
      where: { userId, isDefault: true },
      include: fullInclude,
    });
  }

  /** Ensures at most one default schedule per user, within the same transaction. */
  private async clearOtherDefaults(
    tx: Prisma.TransactionClient,
    userId: string,
    exceptId?: string,
  ): Promise<void> {
    await tx.availabilitySchedule.updateMany({
      where: { userId, isDefault: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
      data: { isDefault: false },
    });
  }

  create(
    userId: string,
    data: { name: string; timezone: string; isDefault: boolean },
    weeklyHours: WeeklyHourInput[],
  ): Promise<ScheduleWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) await this.clearOtherDefaults(tx, userId);
      return tx.availabilitySchedule.create({
        data: {
          ...data,
          userId,
          weeklyHours: weeklyHours.length ? { create: weeklyHours } : undefined,
        },
        include: fullInclude,
      });
    });
  }

  /** Replace-all semantics for weekly hours when provided. */
  update(
    id: string,
    userId: string,
    data: { name?: string; timezone?: string; isDefault?: boolean },
    weeklyHours?: WeeklyHourInput[],
  ): Promise<ScheduleWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) await this.clearOtherDefaults(tx, userId, id);
      if (weeklyHours) {
        await tx.weeklyHour.deleteMany({ where: { scheduleId: id } });
        if (weeklyHours.length) {
          await tx.weeklyHour.createMany({
            data: weeklyHours.map((h) => ({ ...h, scheduleId: id })),
          });
        }
      }
      return tx.availabilitySchedule.update({ where: { id }, data, include: fullInclude });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.availabilitySchedule.delete({ where: { id } });
  }

  async upsertOverride(scheduleId: string, data: DateOverrideInput): Promise<void> {
    const date = new Date(`${data.date}T00:00:00.000Z`);
    const fields = {
      isUnavailable: data.isUnavailable,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
    };
    await this.prisma.dateOverride.upsert({
      where: { scheduleId_date: { scheduleId, date } },
      create: { scheduleId, date, ...fields },
      update: fields,
    });
  }

  async deleteOverride(scheduleId: string, overrideId: string): Promise<void> {
    await this.prisma.dateOverride.deleteMany({ where: { id: overrideId, scheduleId } });
  }
}
