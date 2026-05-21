import { formatInTimeZone } from 'date-fns-tz';
import { sendEmail } from '../../lib/email';
import { env } from '../../config/env';

/** The minimal booking shape the email templates read. */
interface EmailBooking {
  id: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  startTime: Date;
  eventType: { title: string; durationMinutes: number };
  host: { name: string };
}

/** Human-friendly date+time rendered in the invitee's own timezone. */
function formatWhen(booking: EmailBooking): string {
  return formatInTimeZone(
    booking.startTime,
    booking.inviteeTimezone,
    "EEEE, MMMM d, yyyy 'at' h:mm a (zzz)",
  );
}

/** Sends the "you are scheduled" confirmation to the invitee. */
export async function sendBookingConfirmation(booking: EmailBooking): Promise<void> {
  const when = formatWhen(booking);
  const cancelUrl = `${env.FRONTEND_URL}/bookings/${booking.id}/cancel`;
  await sendEmail({
    to: booking.inviteeEmail,
    subject: `Confirmed: ${booking.eventType.title} with ${booking.host.name}`,
    html: `
      <h2>You are scheduled ✅</h2>
      <p>Hi ${booking.inviteeName}, your meeting is confirmed.</p>
      <p><strong>${booking.eventType.title}</strong> (${booking.eventType.durationMinutes} min)<br/>
      with ${booking.host.name}<br/>
      ${when}</p>
      <p>Need to make a change? <a href="${cancelUrl}">Cancel or reschedule</a>.</p>
    `,
  });
}

/** Sends a cancellation notice to the invitee. */
export async function sendBookingCancellation(booking: EmailBooking): Promise<void> {
  await sendEmail({
    to: booking.inviteeEmail,
    subject: `Cancelled: ${booking.eventType.title} with ${booking.host.name}`,
    html: `
      <h2>Your meeting was cancelled</h2>
      <p>Hi ${booking.inviteeName}, the following meeting has been cancelled:</p>
      <p><strong>${booking.eventType.title}</strong><br/>${formatWhen(booking)}</p>
    `,
  });
}
