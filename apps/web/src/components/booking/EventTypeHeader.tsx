import { Clock, Video } from 'lucide-react';
import type { PublicEvent } from '@/types/api';

/**
 * Left panel of the booking page: host avatar/name, the event title, duration,
 * location line, and description — matching Calendly's sticky info column.
 */
export function EventTypeHeader({ event }: { event: PublicEvent }) {
  const { host, eventType } = event;
  return (
    <div className="md:sticky md:top-8">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white">
        {host.name.charAt(0).toUpperCase()}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{host.name}</p>
      <h1 className="mt-1 text-2xl font-bold text-foreground">{eventType.title}</h1>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4" /> {eventType.durationMinutes} min
        </p>
        <p className="flex items-center gap-2">
          <Video className="h-4 w-4" /> Web conferencing details provided upon confirmation
        </p>
      </div>

      {eventType.description && (
        <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
          {eventType.description}
        </p>
      )}
    </div>
  );
}
