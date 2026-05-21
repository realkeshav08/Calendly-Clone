'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Calendar, Clock, User } from 'lucide-react';
import { usePublicBooking } from '@/hooks/useBooking';
import { formatDateTime } from '@/lib/time';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** Post-booking confirmation: the "You are scheduled" screen with meeting details. */
export default function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError } = usePublicBooking(bookingId);

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Booking not found</AlertTitle>
          <AlertDescription>This confirmation link may be invalid.</AlertDescription>
        </Alert>
      )}

      {isLoading && <Skeleton className="h-72 w-full rounded-xl" />}

      {booking && (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
          <h1 className="text-2xl font-bold text-foreground">You are scheduled</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A calendar invitation has been sent to your email address.
          </p>

          <div className="mt-6 space-y-3 rounded-lg border border-border bg-gray-50 p-5 text-left text-sm">
            <p className="text-base font-semibold text-foreground">{booking.eventType.title}</p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" /> {booking.host.name}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDateTime(booking.startTime, booking.inviteeTimezone)}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> {booking.eventType.durationMinutes} min ·{' '}
              {booking.inviteeTimezone.replace(/_/g, ' ')}
            </p>
          </div>

          {booking.status === 'CANCELLED' ? (
            <p className="mt-6 text-sm font-medium text-destructive">This meeting was canceled.</p>
          ) : (
            <div className="mt-6 flex justify-center gap-4 text-sm font-medium">
              <Link href={`/bookings/${booking.id}/cancel`} className="text-brand hover:underline">
                Cancel
              </Link>
              <span className="text-border">|</span>
              <Link
                href={`/bookings/${booking.id}/reschedule`}
                className="text-brand hover:underline"
              >
                Reschedule
              </Link>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
