'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventTypeHeader } from '@/components/booking/EventTypeHeader';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { TimezoneSelect } from '@/components/availability/TimezoneSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError } from '@/lib/api';
import { formatLongDate, formatDateTime } from '@/lib/time';
import { usePublicEvent, useSlots, useMonthAvailability } from '@/hooks/useSlots';
import { useReschedulePublicBooking } from '@/hooks/useBooking';
import type { Booking } from '@/types/api';

/**
 * Reschedule UI for an existing booking. Reuses the same calendar + slot picker as
 * the booking page, but confirming calls the reschedule endpoint (which books the
 * new time and marks the original RESCHEDULED) and routes to the new confirmation.
 */
export function RescheduleFlow({ booking }: { booking: Booking }) {
  const router = useRouter();
  const username = booking.host.username;
  const eventSlug = booking.eventType.slug;

  const [timezone, setTimezone] = useState(booking.inviteeTimezone);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthKey = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}`;
  const { data: event } = usePublicEvent(username, eventSlug);
  const { data: availability } = useMonthAvailability(username, eventSlug, monthKey, timezone);
  const { data: slots, isLoading: slotsLoading } = useSlots(
    username,
    eventSlug,
    selectedDate,
    timezone,
  );
  const reschedule = useReschedulePublicBooking(booking.id);

  function confirm(iso: string) {
    setError(null);
    reschedule.mutate(
      { startTime: iso },
      {
        onSuccess: (updated) => router.push(`/${username}/${eventSlug}/confirmation/${updated.id}`),
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : 'Could not reschedule. Try again.'),
      },
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl md:grid md:min-h-[600px] md:grid-cols-[360px_1fr]">
        <div className="border-b border-border p-8 md:border-b-0 md:border-r">
          {event ? <EventTypeHeader event={event} /> : <Skeleton className="h-48 w-full" />}
          <div className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Rescheduling your meeting currently set for{' '}
            <strong>{formatDateTime(booking.startTime, booking.inviteeTimezone)}</strong>.
          </div>
        </div>

        <div className="p-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">Pick a new time</h2>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div>
              <BookingCalendar
                viewMonth={viewMonth}
                onMonthChange={setViewMonth}
                availability={availability}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                timezone={timezone}
              />
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Time zone</p>
                <TimezoneSelect value={timezone} onChange={setTimezone} withIcon />
              </div>
            </div>
            {selectedDate && (
              <TimeSlotPicker
                slots={slots}
                isLoading={slotsLoading || reschedule.isPending}
                timezone={timezone}
                dateLabel={formatLongDate(`${selectedDate}T12:00:00Z`, 'UTC')}
                onConfirm={confirm}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
