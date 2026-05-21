'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { usePublicBooking, useCancelPublicBooking } from '@/hooks/useBooking';
import { formatDateTime } from '@/lib/time';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** Public cancellation page reached from the confirmation screen or email link. */
export default function CancelBookingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading } = usePublicBooking(id);
  const cancel = useCancelPublicBooking(id);
  const [reason, setReason] = useState('');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Alert variant="destructive">
          <AlertTitle>Booking not found</AlertTitle>
          <AlertDescription>This cancellation link may be invalid.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const done = cancel.isSuccess || booking.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card className="p-8">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <h1 className="text-xl font-bold">Cancellation confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your meeting has been canceled.</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground">Cancel this meeting?</h1>
            <div className="mt-4 rounded-lg border border-border bg-gray-50 p-4 text-sm">
              <p className="font-semibold">{booking.eventType.title}</p>
              <p className="text-muted-foreground">
                {formatDateTime(booking.startTime, booking.inviteeTimezone)}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let the host know why you're canceling."
              />
            </div>
            <Button
              variant="destructive"
              className="mt-4 w-full"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(reason || undefined)}
            >
              {cancel.isPending ? 'Canceling…' : 'Cancel meeting'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
