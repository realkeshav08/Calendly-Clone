/** A channel-agnostic message. New channels (SMS, Slack) consume the same shape. */
export interface NotificationMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Strategy interface for delivering a notification.
 *
 * The booking flow depends only on this abstraction, so new delivery mechanisms
 * can be added without touching it (Open/Closed). Implementations are fully
 * interchangeable (Liskov): each accepts the same message and resolves without
 * throwing — delivery is best-effort and must never fail the surrounding action.
 */
export interface INotificationChannel {
  /** Human-readable channel name, used in logs. */
  readonly name: string;
  send(message: NotificationMessage): Promise<void>;
}
