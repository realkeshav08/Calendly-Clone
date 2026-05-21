'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAY_LABELS_SHORT } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { WeeklyHourInput } from 'shared';

interface WeeklyHoursEditorProps {
  /** Flat list of windows across all days; the editor groups them by day. */
  value: WeeklyHourInput[];
  onChange: (hours: WeeklyHourInput[]) => void;
}

/** 15-minute time options "00:00" … "23:45" for the start/end pickers. */
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0');
  const m = String((i % 4) * 15).padStart(2, '0');
  return `${h}:${m}`;
});

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIME_OPTIONS.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Calendly-style weekly hours editor. Each day is a row: a checkbox toggles
 * availability, and when enabled the day shows one or more start–end windows with
 * controls to add or remove windows. The component is fully controlled — it emits
 * the complete flat windows array on every change, matching the API's replace-all
 * update semantics.
 */
export function WeeklyHoursEditor({ value, onChange }: WeeklyHoursEditorProps) {
  const windowsForDay = (day: number) => value.filter((w) => w.dayOfWeek === day);

  function setDayWindows(day: number, windows: WeeklyHourInput[]) {
    onChange([...value.filter((w) => w.dayOfWeek !== day), ...windows]);
  }

  function toggleDay(day: number, enabled: boolean) {
    setDayWindows(day, enabled ? [{ dayOfWeek: day, startTime: '09:00', endTime: '17:00' }] : []);
  }

  function addWindow(day: number) {
    setDayWindows(day, [
      ...windowsForDay(day),
      { dayOfWeek: day, startTime: '09:00', endTime: '17:00' },
    ]);
  }

  function updateWindow(day: number, index: number, patch: Partial<WeeklyHourInput>) {
    const updated = windowsForDay(day).map((w, i) => (i === index ? { ...w, ...patch } : w));
    setDayWindows(day, updated);
  }

  function removeWindow(day: number, index: number) {
    setDayWindows(
      day,
      windowsForDay(day).filter((_, i) => i !== index),
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-white">
      {DAY_LABELS_SHORT.map((label, day) => {
        const windows = windowsForDay(day);
        const enabled = windows.length > 0;
        return (
          <div key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <label className="flex w-32 shrink-0 cursor-pointer items-center gap-3 pt-1.5">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => toggleDay(day, e.target.checked)}
                className="h-4 w-4"
              />
              <span className={cn('text-sm font-semibold', !enabled && 'text-muted-foreground')}>
                {label}
              </span>
            </label>

            <div className="flex-1">
              {!enabled ? (
                <p className="pt-1.5 text-sm text-muted-foreground">Unavailable</p>
              ) : (
                <div className="space-y-2">
                  {windows.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <TimePicker
                        value={w.startTime}
                        onChange={(v) => updateWindow(day, i, { startTime: v })}
                      />
                      <span className="text-muted-foreground">–</span>
                      <TimePicker
                        value={w.endTime}
                        onChange={(v) => updateWindow(day, i, { endTime: v })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove time window"
                        onClick={() => removeWindow(day, i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => addWindow(day)}>
                    <Plus className="h-4 w-4" /> Add time
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
