'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventTypeForm } from '@/components/event-types/EventTypeForm';
import { useEventType, useUpdateEventType } from '@/hooks/useEventTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditEventTypePage() {
  const { id } = useParams<{ id: string }>();
  const { data: eventType, isLoading, isError } = useEventType(id);
  const update = useUpdateEventType(id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Event Type" subtitle="Update this event's details." />
      {isLoading && <Skeleton className="h-96 w-full rounded-xl" />}
      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Event type not found</AlertTitle>
          <AlertDescription>It may have been deleted.</AlertDescription>
        </Alert>
      )}
      {eventType && (
        <EventTypeForm
          initial={eventType}
          onSubmit={(data) => update.mutateAsync(data)}
          submitLabel="Save changes"
        />
      )}
    </div>
  );
}
