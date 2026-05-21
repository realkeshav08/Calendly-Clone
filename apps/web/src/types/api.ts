/**
 * Types mirroring the Express API's JSON responses. Hand-maintained to match the
 * Prisma models the API returns; request bodies reuse Zod types from `shared`.
 */
import type { BookingStatus } from 'shared';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  timezone: string;
}

export interface CustomQuestion {
  id: string;
  question: string;
  isRequired: boolean;
  order: number;
}

export interface EventType {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  bufferBeforeMins: number;
  bufferAfterMins: number;
  color: string;
  isActive: boolean;
  scheduleId: string | null;
  customQuestions: CustomQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyHour {
  id: string;
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface DateOverride {
  id: string;
  scheduleId: string;
  date: string;
  isUnavailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface AvailabilitySchedule {
  id: string;
  userId: string;
  name: string;
  timezone: string;
  isDefault: boolean;
  weeklyHours: WeeklyHour[];
  dateOverrides: DateOverride[];
}

export interface BookingEventTypeRef {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  color: string;
}

export interface BookingHostRef {
  id: string;
  name: string;
  username: string;
  timezone: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  hostId: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  cancellationReason: string | null;
  cancelledAt: string | null;
  notes: string | null;
  answers: { questionId: string; question: string; answer: string }[] | null;
  eventType: BookingEventTypeRef;
  host: BookingHostRef;
  createdAt: string;
  updatedAt: string;
}

/** Public booking-page event payload (GET /api/public/:username/:eventSlug). */
export interface PublicEvent {
  host: { name: string; username: string; timezone: string };
  eventType: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    durationMinutes: number;
    color: string;
    customQuestions: CustomQuestion[];
  };
}

/** Public host landing page payload (GET /api/public/:username). */
export interface PublicProfile {
  host: { name: string; username: string; timezone: string };
  eventTypes: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    durationMinutes: number;
    color: string;
  }[];
}

/** Standard API error envelope. */
export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}
