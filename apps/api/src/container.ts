import { prisma } from './lib/prisma';
import { env } from './config/env';
import { logger } from './lib/logger';
import { UserRepository } from './repositories/user.repository';
import { EventTypeRepository } from './repositories/eventType.repository';
import { ScheduleRepository } from './repositories/schedule.repository';
import { BookingRepository } from './repositories/booking.repository';
import type { INotificationChannel } from './services/notification/channel';
import { EmailChannel } from './services/notification/emailChannel';
import { ConsoleChannel } from './services/notification/consoleChannel';
import { NotificationService } from './services/notification/notificationService';
import { UserService } from './modules/users/users.service';
import { EventTypeService } from './modules/eventTypes/eventTypes.service';
import { AvailabilityService } from './modules/availability/availability.service';
import { SlotService } from './modules/slots/slots.service';
import { BookingService } from './modules/bookings/bookings.service';

/**
 * Composition root: the single place that constructs concrete classes and wires
 * dependencies together. Everything else depends on abstractions and receives its
 * collaborators through constructors, so the wiring is centralized and swappable
 * (e.g. inject fakes in tests, or a different repository implementation).
 */
function buildNotificationService(): NotificationService {
  // Choose the delivery strategy from configuration: real email when a key is set,
  // otherwise log to the console so booking still works end-to-end in dev.
  const channel: INotificationChannel = env.RESEND_API_KEY
    ? new EmailChannel(
        env.RESEND_API_KEY,
        env.EMAIL_FROM ?? 'Calendly Clone <onboarding@resend.dev>',
      )
    : new ConsoleChannel();
  logger.info({ channel: channel.name }, 'Notification channel selected');
  return new NotificationService([channel], env.FRONTEND_URL);
}

// Repositories (data layer).
const userRepository = new UserRepository(prisma);
const eventTypeRepository = new EventTypeRepository(prisma);
const scheduleRepository = new ScheduleRepository(prisma);
const bookingRepository = new BookingRepository(prisma);

// Cross-cutting services.
const notificationService = buildNotificationService();

// Application services (depend on repository interfaces + each other).
const slotService = new SlotService(
  userRepository,
  eventTypeRepository,
  scheduleRepository,
  bookingRepository,
);

export const container = {
  userRepository,
  userService: new UserService(userRepository),
  eventTypeService: new EventTypeService(eventTypeRepository, bookingRepository),
  availabilityService: new AvailabilityService(scheduleRepository),
  slotService,
  bookingService: new BookingService(bookingRepository, slotService, notificationService),
};
