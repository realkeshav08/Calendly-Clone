'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { EventTypeForm } from '@/components/event-types/EventTypeForm';
import { useCreateEventType } from '@/hooks/useEventTypes';

export default function NewEventTypePage() {
  const create = useCreateEventType();
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Event Type" subtitle="Set up a new bookable meeting." />
      <EventTypeForm
        onSubmit={(data) => create.mutateAsync(data)}
        submitLabel="Create event type"
      />
    </div>
  );
}
