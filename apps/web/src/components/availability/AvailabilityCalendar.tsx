'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dateKeyFromParts } from '@/lib/time';
import type { WeeklyHourInput } from 'shared';
import type { DateOverride } from '@/types/api';

/** "09:00" → "9:00am", "17:30" → "5:30pm". */
function to12h(hm: string): string {
  const [h, m] = hm.split(':').map(Number);
  const period = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')}${period}`;
}

/**
 * Calendar view of an availability schedule (Calendly's "Calendar" tab): a month
 * grid projecting the recurring weekly hours onto each date AND any date-specific
 * overrides, so it reflects every change saved in the List view. A date override
 * wins over the weekly hours for that day (custom hours or "Unavailable"), matching
 * the slot-generation logic. Read-only — editing happens in the List view.
 */
export function AvailabilityCalendar({
  hours,
  dateOverrides,
  timezone,
}: {
  hours: WeeklyHourInput[];
  dateOverrides: DateOverride[];
  timezone: string;
}) {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weeklyByDay = (dow: number) =>
    hours
      .filter((h) => h.dayOfWeek === dow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  /** Resolve what a given date shows: a date override (if any) beats weekly hours. */
  function resolveDay(dateKey: string, dow: number) {
    const override = dateOverrides.find((o) => o.date.slice(0, 10) === dateKey);
    if (override) {
      if (override.isUnavailable || !override.startTime || !override.endTime) {
        return { kind: 'override-off' as const, windows: [] };
      }
      return {
        kind: 'override' as const,
        windows: [{ startTime: override.startTime, endTime: override.endTime }],
      };
    }
    return { kind: 'weekly' as const, windows: weeklyByDay(dow) };
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold text-foreground">{monthLabel}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <span className="text-sm font-medium text-brand">{timezone.replace(/_/g, ' ')}</span>
      </div>

      <div className="grid grid-cols-7 border-l border-t border-border text-xs">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
          <div
            key={d}
            className="border-b border-r border-border py-2 text-center font-semibold text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null)
            return (
              <div key={`b-${i}`} className="min-h-[92px] border-b border-r border-border bg-gray-50/50" />
            );
          const dow = new Date(year, month, day).getDay();
          const { kind, windows } = resolveDay(dateKeyFromParts(year, month, day), dow);
          return (
            <div key={day} className="min-h-[92px] border-b border-r border-border p-1.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{day}</span>
                {kind === 'weekly' && windows.length > 0 && (
                  <Repeat className="h-3 w-3 text-muted-foreground" />
                )}
                {(kind === 'override' || kind === 'override-off') && (
                  <Pencil className="h-3 w-3 text-amber-500" />
                )}
              </div>
              <div className="space-y-0.5">
                {kind === 'override-off' ? (
                  <p className="text-[11px] leading-tight text-muted-foreground">Unavailable</p>
                ) : (
                  windows.map((w, idx) => (
                    <p
                      key={idx}
                      className={cn(
                        'text-[11px] leading-tight',
                        kind === 'override' ? 'font-medium text-amber-600' : 'text-brand',
                      )}
                    >
                      {to12h(w.startTime)} – {to12h(w.endTime)}
                    </p>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
