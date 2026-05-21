import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from '../../lib/logger';
import type { INotificationChannel, NotificationMessage } from './channel';

/**
 * Delivers notifications as email via Resend's SMTP bridge. Constructed only when
 * an API key is available (see the container), so its mere existence means email
 * is configured — a delivery error is logged but swallowed so a booking never fails.
 */
export class EmailChannel implements INotificationChannel {
  readonly name = 'email';
  private readonly transporter: Transporter;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: apiKey },
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      logger.info({ to: message.to, channel: this.name }, 'Notification sent');
    } catch (err) {
      logger.error({ err, to: message.to, channel: this.name }, 'Notification delivery failed');
    }
  }
}
