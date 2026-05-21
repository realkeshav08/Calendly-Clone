'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { WeeklyHoursEditor } from '@/components/availability/WeeklyHoursEditor';
import { DateOverridesEditor } from '@/components/availability/DateOverridesEditor';
import { TimezoneSelect } from '@/components/availability/TimezoneSelect';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSchedules, useUpdateSchedule } from '@/hooks/useAvailability';
import type { WeeklyHourInput } from 'shared';

export default function AvailabilityPage() {
  const { data: schedules, isLoading } = useSchedules();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [hours, setHours] = useState<WeeklyHourInput[]>([]);
  const [saved, setSaved] = useState(false);

  const selected = schedules?.find((s) => s.id === selectedId) ?? schedules?.[0];
  const update = useUpdateSchedule(selected?.id ?? '');

  // Sync local editing state whenever the selected schedule changes.
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

  if (isLoading || !selected) {
    return (
      <>
        <PageHeader title="Availability" subtitle="Set the times you're available to meet." />
        <Skeleton className="h-96 w-full rounded-xl" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Availability"
        subtitle="Set the times you're available for people to book."
        action={
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
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="w-56">
          <Select value={selected.id} onValueChange={setSelectedId}>
            <SelectTrigger aria-label="Select schedule">
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
        <div className="w-56">
          <TimezoneSelect value={timezone} onChange={setTimezone} withIcon />
        </div>
      </div>

      <div className="space-y-8">
        <WeeklyHoursEditor value={hours} onChange={setHours} />
        <DateOverridesEditor schedule={selected} />
      </div>
    </>
  );
}
