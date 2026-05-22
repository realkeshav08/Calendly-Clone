'use client';

import { useEffect, useState } from 'react';
import { Check, List, CalendarDays, MoreVertical } from 'lucide-react';
import { WeeklyHoursEditor } from '@/components/availability/WeeklyHoursEditor';
import { DateOverridesEditor } from '@/components/availability/DateOverridesEditor';
import { AvailabilityCalendar } from '@/components/availability/AvailabilityCalendar';
import { TimezoneSelect } from '@/components/availability/TimezoneSelect';
import { Button } from '@/components/ui/button';
import { CalendlyLoader } from '@/components/ui/calendly-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSchedules, useUpdateSchedule } from '@/hooks/useAvailability';
import { useEventTypes } from '@/hooks/useEventTypes';
import { cn } from '@/lib/utils';
import type { WeeklyHourInput } from 'shared';

const TABS = ['Schedules'] as const;

export default function AvailabilityPage() {
  const { data: schedules, isLoading, isError } = useSchedules();
  const { data: eventTypes } = useEventTypes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [hours, setHours] = useState<WeeklyHourInput[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [saved, setSaved] = useState(false);

  const selected = schedules?.find((s) => s.id === selectedId) ?? schedules?.[0];
  const update = useUpdateSchedule(selected?.id ?? '');
  const activeOn = eventTypes?.filter((e) => e.scheduleId === selected?.id).length ?? 0;

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setTimezone(selected.timezone);
    setHours(
      selected.weeklyHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
      })),
    );
  }, [selected]);

  async function save() {
    if (!selected) return;
    await update.mutateAsync({ timezone, weeklyHours: hours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="md:pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Availability</h1>

      <div className="mb-6 mt-4 flex gap-6 border-b border-border">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              'relative cursor-default pb-3 text-sm font-medium',
              i === 0 ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            {tab}
            {i === 0 && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
          </span>
        ))}
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load availability</AlertTitle>
          <AlertDescription>Make sure the API is running, then try again.</AlertDescription>
        </Alert>
      ) : isLoading || !selected ? (
        <CalendlyLoader />
      ) : (
        <div className="rounded-xl border border-border bg-white">
          {/* Schedule header */}
          <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Schedule</p>
              <div className="mt-1 w-60">
                <Select value={selected.id} onValueChange={setSelectedId}>
                  <SelectTrigger aria-label="Select schedule" className="border-0 px-0 text-lg font-bold text-brand shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.isDefault ? ' (default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-1 text-sm text-brand">
                Active on: {activeOn} event type{activeOn === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
                    view === 'list' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <List className="h-4 w-4" /> List
                </button>
                <button
                  type="button"
                  onClick={() => setView('calendar')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
                    view === 'calendar' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <CalendarDays className="h-4 w-4" /> Calendar
                </button>
              </div>
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="p-6">
            {view === 'list' ? (
              <div className="space-y-8">
                <div className="flex justify-end">
                  <Button onClick={save} disabled={update.isPending}>
                    {saved ? (
                      <>
                        <Check className="h-4 w-4" /> Saved
                      </>
                    ) : update.isPending ? (
                      'Saving…'
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">Weekly hours</h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Set when you are typically available for meetings.
                    </p>
                    <WeeklyHoursEditor value={hours} onChange={setHours} />
                    <div className="mt-4 w-56">
                      <TimezoneSelect value={timezone} onChange={setTimezone} withIcon />
                    </div>
                  </div>
                  <div className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <DateOverridesEditor schedule={selected} />
                  </div>
                </div>
              </div>
            ) : (
              <AvailabilityCalendar hours={hours} timezone={timezone} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
