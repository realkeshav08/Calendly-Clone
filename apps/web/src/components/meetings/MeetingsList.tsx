'use client';

import type { Booking } from '@/types/api';
import { formatLongDate, formatTimeRange } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { CalendlyLoader } from '@/components/ui/calendly-loader';
import { MeetingsEmptyState } from './MeetingsEmptyState';

interface MeetingsListProps {
  bookings: Booking[] | undefined;
  isLoading: boolean;
  /** Whether to render a cancel action (upcoming only). */
  canCancel: boolean;
  onCancel: (id: string) => void;
  /** Empty-state message, e.g. "No Upcoming Events". */
  emptyLabel: string;
}

/** Groups bookings by their day (in the host's timezone) for date headers. */
function groupByDay(bookings: Booking[], timezone: string): Map<string, Booking[]> {
  const groups = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = formatLongDate(b.startTime, timezone);
    const list = groups.get(key) ?? [];
    list.push(b);
    groups.set(key, list);
  }
  return groups;
}

/**
 * Renders bookings grouped under date headers, Calendly-meetings style. Each row
 * shows the time range, event title, and invitee, with an optional cancel button.
 * Times render in the host's own timezone.
 */
export function MeetingsList({
  bookings,
  isLoading,
  canCancel,
  onCancel,
  emptyLabel,
}: MeetingsListProps) {
  if (isLoading) return <CalendlyLoader />;

  if (!bookings || bookings.length === 0) {
    return <MeetingsEmptyState label={emptyLabel} />;
  }

  // The host timezone is consistent across a host's bookings.
  const hostTimezone = bookings[0].host.timezone;
  const groups = groupByDay(bookings, hostTimezone);

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([day, dayBookings]) => (
        <div key={day}>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{day}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
            {dayBookings.map((b) => (
              <li key={b.id} className="group flex items-center gap-4 px-5 py-4">
                <div
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: b.eventType.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {formatTimeRange(b.startTime, b.endTime, hostTimezone)}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {b.eventType.title} · {b.inviteeName}
                    {b.status === 'CANCELLED' && (
                      <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-destructive">
                        Canceled
                      </span>
                    )}
                  </p>
                </div>
                {canCancel && b.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 transition group-hover:opacity-100"
                    onClick={() => onCancel(b.id)}
                  >
                    Cancel
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
