import { logger } from '../../lib/logger';
import type { INotificationChannel, NotificationMessage } from './channel';

/**
 * Fallback channel used when no real delivery channel (email) is configured —
 * common in local dev. It logs the notification instead of sending it, so the
 * booking flow stays fully functional without SMTP credentials.
 */
export class ConsoleChannel implements INotificationChannel {
  readonly name = 'console';

  async send(message: NotificationMessage): Promise<void> {
    logger.info({ to: message.to, subject: message.subject }, '[console notification]');
  }
}
