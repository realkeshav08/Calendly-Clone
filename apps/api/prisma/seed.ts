import { PrismaClient } from '@prisma/client';
import { createNeonAdapter } from '../src/lib/neonAdapter';

/**
 * Idempotent seed. Wipes domain tables (dev-only data) and recreates a complete
 * demo dataset: one user, two availability schedules, three event types, and four
 * sample bookings spanning past and future. Run with `pnpm seed`.
 *
 * After seeding it prints the demo user's id — copy that into DEFAULT_USER_ID so
 * the stubbed-auth currentUser middleware can find the user.
 *
 * Uses the Neon serverless adapter so it connects over port 443 like the app.
 */
const prisma = new PrismaClient({ adapter: createNeonAdapter() });

/**
 * Fixed id for the demo user so re-seeding is deterministic: DEFAULT_USER_ID never
 * changes between seeds or environments, so the stubbed-auth middleware keeps working.
 */
const DEMO_USER_ID = 'demo-user-0000000000000000';

/** Returns a Date offset from now by a number of days, at a fixed UTC time. */
function daysFromNow(days: number, hourUtc = 9, minute = 0): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, minute, 0, 0);
  return d;
}

async function main(): Promise<void> {
  // Clean slate (order respects FK dependencies).
  await prisma.booking.deleteMany();
  await prisma.customQuestion.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.weeklyHour.deleteMany();
  await prisma.dateOverride.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      email: 'demo@example.com',
      name: 'Demo User',
      username: 'demo',
      timezone: 'Asia/Kolkata',
    },
  });

  // Default schedule: Mon–Fri 09:00–17:00.
  const workingHours = await prisma.availabilitySchedule.create({
    data: {
      userId: user.id,
      name: 'Working Hours',
      timezone: 'Asia/Kolkata',
      isDefault: true,
      weeklyHours: {
        create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
        })),
      },
    },
  });

  // Secondary schedule: Saturday 10:00–14:00 (demonstrates multiple schedules).
  await prisma.availabilitySchedule.create({
    data: {
      userId: user.id,
      name: 'Weekend Hours',
      timezone: 'Asia/Kolkata',
      isDefault: false,
      weeklyHours: { create: [{ dayOfWeek: 6, startTime: '10:00', endTime: '14:00' }] },
    },
  });

  const event15 = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: '15 Minute Meeting',
      slug: '15min',
      description: 'A quick 15-minute sync.',
      durationMinutes: 15,
      color: '#0069ff',
      scheduleId: workingHours.id,
    },
  });

  const event30 = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: '30 Minute Meeting',
      slug: '30min',
      description: 'A standard 30-minute meeting.',
      durationMinutes: 30,
      color: '#16a34a',
      scheduleId: workingHours.id,
    },
  });

  const event60 = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: '60 Minute Strategy Call',
      slug: '60min',
      description: 'A deep-dive strategy session.',
      durationMinutes: 60,
      bufferBeforeMins: 10,
      bufferAfterMins: 10,
      color: '#9333ea',
      scheduleId: workingHours.id,
    },
  });

  // Sample bookings: 2 upcoming, 2 past, across event types and durations.
  await prisma.booking.createMany({
    data: [
      {
        eventTypeId: event30.id,
        hostId: user.id,
        inviteeName: 'Aarav Sharma',
        inviteeEmail: 'aarav@example.com',
        inviteeTimezone: 'Asia/Kolkata',
        startTime: daysFromNow(1, 5, 30), // tomorrow 11:00 IST
        endTime: daysFromNow(1, 6, 0),
      },
      {
        eventTypeId: event60.id,
        hostId: user.id,
        inviteeName: 'Priya Verma',
        inviteeEmail: 'priya@example.com',
        inviteeTimezone: 'America/New_York',
        startTime: daysFromNow(7, 8, 30), // next week 14:00 IST
        endTime: daysFromNow(7, 9, 30),
      },
      {
        eventTypeId: event15.id,
        hostId: user.id,
        inviteeName: 'Liam Johnson',
        inviteeEmail: 'liam@example.com',
        inviteeTimezone: 'Europe/London',
        startTime: daysFromNow(-7, 10, 0), // last week
        endTime: daysFromNow(-7, 10, 15),
      },
      {
        eventTypeId: event30.id,
        hostId: user.id,
        inviteeName: 'Sofia Garcia',
        inviteeEmail: 'sofia@example.com',
        inviteeTimezone: 'Asia/Kolkata',
        startTime: daysFromNow(-30, 7, 0), // last month
        endTime: daysFromNow(-30, 7, 30),
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('\n✅ Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`   DEFAULT_USER_ID=${user.id}`);
  // eslint-disable-next-line no-console
  console.log('   Set that in apps/api/.env, then visit /demo/30min to book.\n');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
