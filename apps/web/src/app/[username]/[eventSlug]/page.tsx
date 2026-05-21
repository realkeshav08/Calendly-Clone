'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventTypeHeader } from '@/components/booking/EventTypeHeader';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { BookingForm } from '@/components/booking/BookingForm';
import { TimezoneSelect } from '@/components/availability/TimezoneSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/lib/api';
import { detectTimezone, formatLongDate } from '@/lib/time';
import { usePublicEvent, useSlots, useMonthAvailability } from '@/hooks/useSlots';
import { useCreateBooking } from '@/hooks/useBooking';

/** Two-step public booking flow: pick a date+time, then enter details. */
export default function BookingPage() {
  const { username, eventSlug } = useParams<{ username: string; eventSlug: string }>();
  const router = useRouter();

  const [timezone, setTimezone] = useState(() => detectTimezone());
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'pick' | 'form'>('pick');

  const monthKey = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}`;

  const { data: event, isLoading: eventLoading, isError } = usePublicEvent(username, eventSlug);
  const { data: availability } = useMonthAvailability(username, eventSlug, monthKey, timezone);
  const { data: slots, isLoading: slotsLoading } = useSlots(
    username,
    eventSlug,
    selectedDate,
    timezone,
  );
  const createBooking = useCreateBooking(username, eventSlug);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isError) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Alert variant="destructive">
          <AlertTitle>Event not found</AlertTitle>
          <AlertDescription>This booking link may be invalid or inactive.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (eventLoading || !event) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  function confirmSlot(iso: string) {
    setSelectedSlot(iso);
    setStep('form');
  }

  function submitBooking(details: Parameters<Parameters<typeof BookingForm>[0]['onSubmit']>[0]) {
    if (!selectedSlot) return;
    setSubmitError(null);
    createBooking.mutate(
      { ...details, startTime: selectedSlot, inviteeTimezone: timezone },
      {
        onSuccess: (booking) => router.push(`/${username}/${eventSlug}/confirmation/${booking.id}`),
        onError: (err) =>
          setSubmitError(
            err instanceof ApiError ? err.message : 'Could not schedule. Please try again.',
          ),
      },
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm md:grid md:grid-cols-[340px_1fr]">
        <div className="border-b border-border p-8 md:border-b-0 md:border-r">
          <EventTypeHeader event={event} />
        </div>

        <div className="p-8">
          {step === 'pick' ? (
            <>
              <h2 className="mb-6 text-xl font-bold text-foreground">Select a Date &amp; Time</h2>
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
                    isLoading={slotsLoading}
                    timezone={timezone}
                    dateLabel={formatLongDate(`${selectedDate}T12:00:00Z`, 'UTC')}
                    onConfirm={confirmSlot}
                  />
                )}
              </div>
            </>
          ) : (
            <BookingForm
              event={event}
              submitting={createBooking.isPending}
              errorMessage={submitError}
              onBack={() => setStep('pick')}
              onSubmit={submitBooking}
            />
          )}
        </div>
      </div>
    </div>
  );
}
