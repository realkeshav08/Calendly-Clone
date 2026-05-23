import { describe, it, expect } from 'vitest';
import { formatInTimeZone } from 'date-fns-tz';
import {
  generateAvailableSlotsForDate,
  type SlotSchedule,
  type SlotEventType,
  type ExistingBooking,
} from './slots';

/** A fixed "now" far in the past so no slot is filtered as past-dated, unless a test overrides it. */
const NOW = new Date('2020-01-01T00:00:00Z');

const event = (overrides: Partial<SlotEventType> = {}): SlotEventType => ({
  durationMinutes: 30,
  bufferBeforeMins: 0,
  bufferAfterMins: 0,
  ...overrides,
});

/** Mon–Fri 09:00–17:00 schedule in a given timezone, no overrides. */
const weekdaySchedule = (timezone: string): SlotSchedule => ({
  timezone,
  dateOverrides: [],
  weeklyHours: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: '09:00',
    endTime: '17:00',
  })),
});

/** Helper: render UTC ISO slots as wall-clock "HH:mm" in a viewing timezone. */
const asLocal = (slots: string[], tz: string): string[] =>
  slots.map((s) => formatInTimeZone(new Date(s), tz, 'HH:mm'));

describe('generateAvailableSlotsForDate', () => {
  it('produces back-to-back 30-min slots across a full working day', () => {
    // 2026-03-12 is a Thursday.
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    // 09:00–17:00 = 8h = 16 thirty-minute slots, first at 09:00, last starting 16:30.
    expect(slots).toHaveLength(16);
    const local = asLocal(slots, 'Asia/Kolkata');
    expect(local[0]).toBe('09:00');
    expect(local[local.length - 1]).toBe('16:30');
  });

  it('returns no slots on a day with no weekly hours (Sunday)', () => {
    // 2026-03-15 is a Sunday — not in the Mon–Fri schedule.
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-15',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    expect(slots).toEqual([]);
  });

  it('does not emit a partial trailing slot (60-min event in 09:00–17:00)', () => {
    const slots = generateAvailableSlotsForDate({
      eventType: event({ durationMinutes: 60 }),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    expect(slots).toHaveLength(8); // 09:00 … 16:00
    expect(asLocal(slots, 'Asia/Kolkata').at(-1)).toBe('16:00');
  });

  it('honors India half-hour offset: 09:00 IST is 03:30 UTC', () => {
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    expect(slots[0]).toBe('2026-03-12T03:30:00.000Z');
  });

  it('removes a slot that conflicts with an existing booking', () => {
    // Block 10:00–10:30 IST = 04:30–05:00 UTC.
    const booking: ExistingBooking = {
      startTime: new Date('2026-03-12T04:30:00Z'),
      endTime: new Date('2026-03-12T05:00:00Z'),
    };
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [booking],
      now: NOW,
    });
    expect(asLocal(slots, 'Asia/Kolkata')).not.toContain('10:00');
    expect(asLocal(slots, 'Asia/Kolkata')).toContain('10:30');
  });

  it('allows a slot whose start touches a booking end when buffers are zero', () => {
    // Booking 09:00–09:30 IST. The 09:30 slot starts exactly at the booking end → allowed.
    const booking: ExistingBooking = {
      startTime: new Date('2026-03-12T03:30:00Z'), // 09:00 IST
      endTime: new Date('2026-03-12T04:00:00Z'), // 09:30 IST
    };
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [booking],
      now: NOW,
    });
    const local = asLocal(slots, 'Asia/Kolkata');
    expect(local).not.toContain('09:00');
    expect(local).toContain('09:30');
  });

  it('spaces slots by duration + max(buffer) so the buffer is built into the grid', () => {
    // 15-min event with 5-min buffers (both sides). Step = 15 + max(5,5) = 20.
    // Window 09:00–17:00 → 09:00, 09:20, 09:40, 10:00, …
    const slots = generateAvailableSlotsForDate({
      eventType: event({ durationMinutes: 15, bufferBeforeMins: 5, bufferAfterMins: 5 }),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    const local = asLocal(slots, 'Asia/Kolkata');
    expect(local.slice(0, 4)).toEqual(['09:00', '09:20', '09:40', '10:00']);
  });

  it('booking a slot does not knock out its buffer-grid neighbours', () => {
    // With the buffer baked into the grid, booking 09:20 must leave 09:00 and 09:40
    // available — the old "select 9:30 → 9:15 and 9:45 disappear" glitch is gone.
    const booking: ExistingBooking = {
      startTime: new Date('2026-03-12T03:50:00Z'), // 09:20 IST
      endTime: new Date('2026-03-12T04:05:00Z'), // 09:35 IST (15-min meeting)
    };
    const slots = generateAvailableSlotsForDate({
      eventType: event({ durationMinutes: 15, bufferBeforeMins: 5, bufferAfterMins: 5 }),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [booking],
      now: NOW,
    });
    const local = asLocal(slots, 'Asia/Kolkata');
    expect(local).toContain('09:00');
    expect(local).toContain('09:40');
    expect(local).not.toContain('09:20'); // the booked slot itself
  });

  it('still blocks slots that genuinely conflict with a booking via buffer', () => {
    // 30-min event with 15-min buffers; step = 30 + 15 = 45.
    // Candidates 09:00, 09:45, 10:30, 11:15, 12:00…
    // A booking 11:00–11:30 (e.g. from a different event) knocks out 10:30
    // (its after-buffer extends to 11:15, overlapping the booking) and 11:15
    // (its before-buffer extends back to 11:00, overlapping the booking start).
    const booking: ExistingBooking = {
      startTime: new Date('2026-03-12T05:30:00Z'), // 11:00 IST
      endTime: new Date('2026-03-12T06:00:00Z'), // 11:30 IST
    };
    const slots = generateAvailableSlotsForDate({
      eventType: event({ durationMinutes: 30, bufferBeforeMins: 15, bufferAfterMins: 15 }),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [booking],
      now: NOW,
    });
    const local = asLocal(slots, 'Asia/Kolkata');
    expect(local).toContain('09:00');
    expect(local).toContain('09:45');
    expect(local).not.toContain('10:30');
    expect(local).not.toContain('11:15');
    expect(local).toContain('12:00');
  });

  it('handles US spring-forward DST: 09:00 ET still maps to a valid wall clock', () => {
    // 2026-03-08 is the US spring-forward date (clocks jump 02:00→03:00 ET).
    // The 09:00 working start is well clear of the gap; verify slots render at 09:00 ET
    // and that the UTC offset reflects EDT (UTC-4), so 09:00 ET = 13:00 UTC.
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('America/New_York'),
      date: '2026-03-08', // a Sunday — no hours; use a weekday near DST instead.
      inviteeTimezone: 'America/New_York',
      existingBookings: [],
      now: NOW,
    });
    // 2026-03-08 is Sunday → empty; this guards that DST date math doesn't crash.
    expect(slots).toEqual([]);

    // The Monday right after spring-forward (already in EDT).
    const monday = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('America/New_York'),
      date: '2026-03-09',
      inviteeTimezone: 'America/New_York',
      existingBookings: [],
      now: NOW,
    });
    expect(monday[0]).toBe('2026-03-09T13:00:00.000Z'); // 09:00 EDT = 13:00 UTC
    expect(asLocal(monday, 'America/New_York')[0]).toBe('09:00');
  });

  it('handles US fall-back DST: 09:00 ET maps to 14:00 UTC under EST', () => {
    // 2026-11-02 is the Monday after fall-back (clocks back to EST, UTC-5).
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('America/New_York'),
      date: '2026-11-02',
      inviteeTimezone: 'America/New_York',
      existingBookings: [],
      now: NOW,
    });
    expect(slots[0]).toBe('2026-11-02T14:00:00.000Z'); // 09:00 EST = 14:00 UTC
  });

  it('applies a date override with custom hours over the weekly schedule', () => {
    const schedule: SlotSchedule = {
      ...weekdaySchedule('Asia/Kolkata'),
      dateOverrides: [
        { date: '2026-03-12', isUnavailable: false, startTime: '13:00', endTime: '15:00' },
      ],
    };
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule,
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    const local = asLocal(slots, 'Asia/Kolkata');
    expect(local).toEqual(['13:00', '13:30', '14:00', '14:30']);
  });

  it('returns no slots when a date override marks the day unavailable', () => {
    const schedule: SlotSchedule = {
      ...weekdaySchedule('Asia/Kolkata'),
      dateOverrides: [{ date: '2026-03-12', isUnavailable: true, startTime: null, endTime: null }],
    };
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule,
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    expect(slots).toEqual([]);
  });

  it('filters out slots at or before `now`', () => {
    // now = 2026-03-12 12:00 IST (06:30 UTC). The 12:00 slot starts exactly at now and
    // is treated as non-bookable; everything earlier drops too, so 12:30 is first.
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('Asia/Kolkata'),
      date: '2026-03-12',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: new Date('2026-03-12T06:30:00Z'),
    });
    const local = asLocal(slots, 'Asia/Kolkata');
    expect(local).not.toContain('09:00');
    expect(local).not.toContain('12:00');
    expect(local[0]).toBe('12:30');
  });

  it('cross-timezone invitee sees host slots converted to their own wall clock', () => {
    // Host schedule in New York, invitee in Kolkata viewing the same calendar date.
    const slots = generateAvailableSlotsForDate({
      eventType: event(),
      schedule: weekdaySchedule('America/New_York'),
      date: '2026-03-09',
      inviteeTimezone: 'Asia/Kolkata',
      existingBookings: [],
      now: NOW,
    });
    // 09:00 EDT = 13:00 UTC = 18:30 IST.
    expect(asLocal(slots, 'Asia/Kolkata')[0]).toBe('18:30');
  });
});
