/** Frontend constants. Brand colors mirror the Tailwind `brand` palette. */
export const BRAND_BLUE = '#0069ff';

/** Preset colors offered when creating an event type. */
export const EVENT_COLORS = [
  '#0069ff', // blue
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#dc2626', // red
  '#0891b2', // cyan
] as const;

export const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;

export const DAY_LABELS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export const DAY_LABELS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** A curated shortlist of common IANA timezones for the dropdowns. */
export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
] as const;
