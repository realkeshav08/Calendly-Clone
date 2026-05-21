'use client';

import { useParams } from 'next/navigation';
import { usePublicBooking } from '@/hooks/useBooking';
import { RescheduleFlow } from '@/components/booking/RescheduleFlow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** Public reschedule page reached from the confirmation screen / email link. */
export default function RescheduleBookingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError } = usePublicBooking(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Alert variant="destructive">
          <AlertTitle>Booking not found</AlertTitle>
          <AlertDescription>This reschedule link may be invalid.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (booking.status === 'CANCELLED') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Alert variant="destructive">
          <AlertTitle>Meeting cancelled</AlertTitle>
          <AlertDescription>A cancelled meeting can&apos;t be rescheduled.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <RescheduleFlow booking={booking} />;
}
