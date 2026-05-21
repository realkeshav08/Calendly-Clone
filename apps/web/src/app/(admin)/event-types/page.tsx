'use client';

import Link from 'next/link';
import { Plus, Calendar } from 'lucide-react';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useMe } from '@/hooks/useMe';
import { EventTypeCard } from '@/components/event-types/EventTypeCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EventTypesPage() {
  const { data: eventTypes, isLoading, isError } = useEventTypes();
  const { data: me } = useMe();

  return (
    <>
      <PageHeader
        title="Event Types"
        subtitle="Create events to share for people to book on your calendar."
        action={
          <Button asChild>
            <Link href="/event-types/new">
              <Plus className="h-4 w-4" /> New Event Type
            </Link>
          </Button>
        }
      />

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load event types</AlertTitle>
          <AlertDescription>Make sure the API is running, then try again.</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      )}

      {eventTypes && eventTypes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No event types yet</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Create your first event type so people can book time with you.
          </p>
          <Button asChild>
            <Link href="/event-types/new">
              <Plus className="h-4 w-4" /> Create your first event type
            </Link>
          </Button>
        </div>
      )}

      {eventTypes && eventTypes.length > 0 && me && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((et) => (
            <EventTypeCard key={et.id} eventType={et} username={me.username} />
          ))}
        </div>
      )}
    </>
  );
}
