import { formatInTimeZone } from 'date-fns-tz';
import type { INotificationChannel } from './channel';

/** The booking fields the notification templates read. */
export interface NotifiableBooking {
  id: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  startTime: Date;
  eventType: { title: string; durationMinutes: number };
  host: { name: string };
}

/**
 * Builds booking notification content and fans it out across one or more
 * {@link INotificationChannel}s. It knows *what* to say (templates) and delegates
 * *how* to deliver to the injected channels — so adding SMS/Slack means adding a
 * channel, not editing this class. Channels are tried in parallel and never throw.
 */
export class NotificationService {
  constructor(
    private readonly channels: INotificationChannel[],
    private readonly frontendUrl: string,
  ) {}

  private formatWhen(booking: NotifiableBooking): string {
    return formatInTimeZone(
      booking.startTime,
      booking.inviteeTimezone,
      "EEEE, MMMM d, yyyy 'at' h:mm a (zzz)",
    );
  }

  private async dispatch(args: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    await Promise.all(this.channels.map((c) => c.send(args)));
  }

  async sendBookingConfirmation(booking: NotifiableBooking): Promise<void> {
    const when = this.formatWhen(booking);
    const manageUrl = `${this.frontendUrl}/bookings/${booking.id}/cancel`;
    await this.dispatch({
      to: booking.inviteeEmail,
      subject: `Confirmed: ${booking.eventType.title} with ${booking.host.name}`,
      text: `You are scheduled. ${booking.eventType.title} with ${booking.host.name} — ${when}. Manage: ${manageUrl}`,
      html: `
        <h2>You are scheduled ✅</h2>
        <p>Hi ${booking.inviteeName}, your meeting is confirmed.</p>
        <p><strong>${booking.eventType.title}</strong> (${booking.eventType.durationMinutes} min)<br/>
        with ${booking.host.name}<br/>${when}</p>
        <p>Need to make a change? <a href="${manageUrl}">Cancel or reschedule</a>.</p>
      `,
    });
  }

  async sendBookingCancellation(booking: NotifiableBooking): Promise<void> {
    await this.dispatch({
      to: booking.inviteeEmail,
      subject: `Cancelled: ${booking.eventType.title} with ${booking.host.name}`,
      text: `Your meeting "${booking.eventType.title}" on ${this.formatWhen(booking)} was cancelled.`,
      html: `
        <h2>Your meeting was cancelled</h2>
        <p>Hi ${booking.inviteeName}, the following meeting has been cancelled:</p>
        <p><strong>${booking.eventType.title}</strong><br/>${this.formatWhen(booking)}</p>
      `,
    });
  }
}
