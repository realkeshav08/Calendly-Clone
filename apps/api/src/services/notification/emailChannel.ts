import { logger } from '../../lib/logger';
import type { INotificationChannel, NotificationMessage } from './channel';

/**
 * Delivers notifications as email via **Resend's HTTPS REST API** (port 443).
 *
 * We deliberately don't use SMTP (nodemailer / smtp.resend.com:465) here because
 * Render's free tier blocks outbound SMTP ports (25 / 465 / 587), which surfaces
 * as ETIMEDOUT on every send. The REST API works over plain HTTPS, which all
 * PaaS providers allow, so this channel works in dev, Render, Vercel, and so on.
 *
 * Delivery is best-effort: any error is logged but swallowed so a failed send
 * never breaks the surrounding action (booking creation, cancellation).
 */
export class EmailChannel implements INotificationChannel {
  readonly name = 'email';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: NotificationMessage): Promise<void> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend HTTP ${res.status}: ${body}`);
      }
      logger.info({ to: message.to, channel: this.name }, 'Notification sent');
    } catch (err) {
      logger.error({ err, to: message.to, channel: this.name }, 'Notification delivery failed');
    }
  }
}
