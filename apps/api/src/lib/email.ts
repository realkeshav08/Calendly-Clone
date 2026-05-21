import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Email delivery via Resend's SMTP bridge, wrapped so the rest of the app never
 * has to care whether email is configured. If RESEND_API_KEY is unset (the common
 * case in local dev), every send becomes a logged no-op instead of crashing — so
 * booking still works end-to-end without SMTP credentials.
 */
const transporter = env.RESEND_API_KEY
  ? nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: env.RESEND_API_KEY },
    })
  : null;

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/** Sends an email if configured; otherwise logs and resolves. Never throws. */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  if (!transporter) {
    logger.info({ to, subject }, 'Email skipped (RESEND_API_KEY not set)');
    return;
  }
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM ?? 'Calendly Clone <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    logger.info({ to, subject }, 'Email sent');
  } catch (err) {
    // Email is a best-effort side effect — a delivery failure must not fail a booking.
    logger.error({ err, to }, 'Email send failed');
  }
}
