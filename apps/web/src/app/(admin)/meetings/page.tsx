'use client';

import { useMemo, useState } from 'react';
import { HelpCircle, ChevronDown, Upload, SlidersHorizontal } from 'lucide-react';
import { MeetingsList } from '@/components/meetings/MeetingsList';
import { DateRangePicker, type DateRange } from '@/components/meetings/DateRangePicker';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toDateKey } from '@/lib/time';
import { useBookings, useCancelBooking } from '@/hooks/useBookings';
import type { Booking } from '@/types/api';

type Tab = 'upcoming' | 'past' | 'range';

export default function MeetingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState<DateRange | null>(null);

  const upcoming = useBookings('upcoming');
  const past = useBookings('past');
  const cancelUpcoming = useCancelBooking('upcoming');

  // Date-range view filters the union of confirmed bookings by the chosen range.
  const rangeBookings = useMemo<Booking[] | undefined>(() => {
    if (!range) return [];
    const all = [...(upcoming.data ?? []), ...(past.data ?? [])];
    return all
      .filter((b) => {
        const key = toDateKey(new Date(b.startTime), b.host.timezone);
        return key >= range.from && key <= range.to;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [range, upcoming.data, past.data]);

  const active =
    tab === 'upcoming'
      ? { data: upcoming.data, isLoading: upcoming.isLoading, empty: 'No Upcoming Events' }
      : tab === 'past'
        ? { data: past.data, isLoading: past.isLoading, empty: 'No Past Events' }
        : {
            data: rangeBookings,
            isLoading: upcoming.isLoading || past.isLoading,
            empty: 'No Events in this range',
          };

  const count = active.data?.length ?? 0;

  const tabBtn = (key: Tab, label: string) => (
    <button
      type="button"
      onClick={() => {
        setTab(key);
        setShowPicker(key === 'range');
      }}
      className={cn(
        'relative flex items-center gap-1 pb-3 text-sm font-medium',
        tab === key ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      {key === 'range' && <ChevronDown className="h-4 w-4" />}
      {tab === key && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
    </button>
  );

  return (
    <div className="md:pt-6">
      <h1 className="mb-5 flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
        Meetings <HelpCircle className="h-5 w-5 text-muted-foreground" />
      </h1>

      {/* Controls row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span
            title="Not part of this demo"
            className="flex cursor-default items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium"
          >
            My Calendly <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            Show buffers <Switch checked onCheckedChange={() => {}} aria-label="Show buffers" />
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Displaying {count === 0 ? 0 : 1} – {count} of {count} Events
        </p>
      </div>

      {/* Tabs + actions */}
      <div className="rounded-xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between border-b border-border">
          <div className="flex gap-6">
            {tabBtn('upcoming', 'Upcoming')}
            {tabBtn('past', 'Past')}
            {tabBtn('range', 'Date Range')}
          </div>
          <div className="flex items-center gap-2 pb-3">
            <span
              title="Not part of this demo"
              className="flex cursor-default items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground"
            >
              <Upload className="h-4 w-4" /> Export
            </span>
            <span
              title="Not part of this demo"
              className="flex cursor-default items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </span>
          </div>
        </div>

        {tab === 'range' && showPicker ? (
          <DateRangePicker
            onApply={(r) => {
              setRange(r);
              setShowPicker(false);
            }}
            onCancel={() => setShowPicker(false)}
          />
        ) : (
          <MeetingsList
            bookings={active.data}
            isLoading={active.isLoading}
            canCancel={tab === 'upcoming'}
            emptyLabel={active.empty}
            onCancel={(id) => {
              if (confirm('Cancel this meeting?')) cancelUpcoming.mutate(id);
            }}
          />
        )}
      </div>
    </div>
  );
}
