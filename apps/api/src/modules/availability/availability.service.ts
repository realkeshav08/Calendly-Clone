import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import type { CreateScheduleInput, UpdateScheduleInput, DateOverrideInput } from 'shared';

const includeRelations = {
  weeklyHours: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
  dateOverrides: { orderBy: { date: 'asc' } },
} satisfies Prisma.AvailabilityScheduleInclude;

/** Lists a user's schedules (default schedule first), with hours and overrides. */
export async function listSchedules(userId: string) {
  return prisma.availabilitySchedule.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    include: includeRelations,
  });
}

export async function getSchedule(userId: string, id: string) {
  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { id, userId },
    include: includeRelations,
  });
  if (!schedule) throw new NotFoundError('Schedule not found');
  return schedule;
}

/**
 * Ensures at most one schedule per user is marked default. When the incoming
 * schedule is default, all of the user's other schedules are unset within the
 * same transaction `tx`.
 */
async function clearOtherDefaults(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  exceptId?: string,
) {
  await tx.availabilitySchedule.updateMany({
    where: { userId, isDefault: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  });
}

export async function createSchedule(userId: string, data: CreateScheduleInput) {
  const { weeklyHours, ...fields } = data;
  return prisma.$transaction(async (tx) => {
    if (fields.isDefault) await clearOtherDefaults(tx, userId);
    return tx.availabilitySchedule.create({
      data: {
        ...fields,
        userId,
        weeklyHours: weeklyHours.length ? { create: weeklyHours } : undefined,
      },
      include: includeRelations,
    });
  });
}

/**
 * Updates a schedule. Weekly hours use replace-all semantics: when provided, the
 * existing windows are deleted and recreated from the payload, so the editor can
 * send the complete desired weekly state instead of diffing individual rows.
 */
export async function updateSchedule(userId: string, id: string, data: UpdateScheduleInput) {
  await getSchedule(userId, id); // ownership check
  const { weeklyHours, ...fields } = data;

  return prisma.$transaction(async (tx) => {
    if (fields.isDefault) await clearOtherDefaults(tx, userId, id);
    if (weeklyHours) {
      await tx.weeklyHour.deleteMany({ where: { scheduleId: id } });
      if (weeklyHours.length) {
        await tx.weeklyHour.createMany({
          data: weeklyHours.map((h) => ({ ...h, scheduleId: id })),
        });
      }
    }
    return tx.availabilitySchedule.update({
      where: { id },
      data: fields,
      include: includeRelations,
    });
  });
}

export async function deleteSchedule(userId: string, id: string) {
  await getSchedule(userId, id); // ownership check
  await prisma.availabilitySchedule.delete({ where: { id } });
}

/** Upserts a date override (unique per schedule+date). */
export async function upsertDateOverride(
  userId: string,
  scheduleId: string,
  data: DateOverrideInput,
) {
  await getSchedule(userId, scheduleId); // ownership check
  const date = new Date(`${data.date}T00:00:00.000Z`);
  return prisma.dateOverride.upsert({
    where: { scheduleId_date: { scheduleId, date } },
    create: {
      scheduleId,
      date,
      isUnavailable: data.isUnavailable,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
    },
    update: {
      isUnavailable: data.isUnavailable,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
    },
  });
}

export async function deleteDateOverride(userId: string, scheduleId: string, overrideId: string) {
  await getSchedule(userId, scheduleId); // ownership check
  await prisma.dateOverride.deleteMany({ where: { id: overrideId, scheduleId } });
}
