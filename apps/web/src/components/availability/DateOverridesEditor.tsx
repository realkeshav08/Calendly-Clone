'use client';

import { useState } from 'react';
import { Plus, Trash2, CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AvailabilitySchedule } from '@/types/api';
import { useAddDateOverride, useDeleteDateOverride } from '@/hooks/useAvailability';

/**
 * Date overrides: one-off exceptions to the weekly hours (a holiday off, or
 * special hours for a single date). Adds via the API immediately rather than
 * batching into the replace-all weekly save, since overrides are independent rows.
 */
export function DateOverridesEditor({ schedule }: { schedule: AvailabilitySchedule }) {
  const add = useAddDateOverride(schedule.id);
  const remove = useDeleteDateOverride(schedule.id);
  const [date, setDate] = useState('');
  const [unavailable, setUnavailable] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  function submit() {
    if (!date) return;
    add.mutate(
      {
        date,
        isUnavailable: unavailable,
        startTime: unavailable ? null : startTime,
        endTime: unavailable ? null : endTime,
      },
      { onSuccess: () => setDate('') },
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Date overrides</h3>
      <p className="text-sm text-muted-foreground">
        Override your weekly hours for specific dates.
      </p>

      {schedule.dateOverrides.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {schedule.dateOverrides.map((o) => (
            <li key={o.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <CalendarOff className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{o.date.slice(0, 10)}</span>
                <span className="text-muted-foreground">
                  {o.isUnavailable ? 'Unavailable' : `${o.startTime} – ${o.endTime}`}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove override"
                onClick={() => remove.mutate(o.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="override-date">Date</Label>
          <Input
            id="override-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unavailable}
            onChange={(e) => setUnavailable(e.target.checked)}
          />
          Unavailable all day
        </label>
        {!unavailable && (
          <div className="flex items-end gap-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-32"
              aria-label="Override start time"
            />
            <span className="pb-2.5 text-muted-foreground">–</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-32"
              aria-label="Override end time"
            />
          </div>
        )}
        <Button type="button" variant="outline" onClick={submit} disabled={!date || add.isPending}>
          <Plus className="h-4 w-4" /> Add override
        </Button>
      </div>
    </div>
  );
}
