'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeeklyHourInput } from 'shared';

/** "09:00" → "9:00am", "17:30" → "5:30pm". */
function to12h(hm: string): string {
  const [h, m] = hm.split(':').map(Number);
  const period = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')}${period}`;
}

/**
 * Calendar view of a weekly availability schedule (Calendly's "Calendar" tab):
 * a month grid that projects the recurring weekly hours onto each date, showing
 * the time window(s) and a recurring indicator. Read-only — editing happens in
 * the List view. The window text reflects the schedule's wall-clock hours.
 */
export function AvailabilityCalendar({
  hours,
  timezone,
}: {
  hours: WeeklyHourInput[];
  timezone: string;
}) {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const byDay = (dow: number) =>
    hours
      .filter((h) => h.dayOfWeek === dow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

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
            return <div key={`b-${i}`} className="min-h-[92px] border-b border-r border-border bg-gray-50/50" />;
          const dow = new Date(year, month, day).getDay();
          const windows = byDay(dow);
          return (
            <div key={day} className="min-h-[92px] border-b border-r border-border p-1.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{day}</span>
                {windows.length > 0 && <Repeat className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="space-y-0.5">
                {windows.map((w, idx) => (
                  <p key={idx} className={cn('text-[11px] leading-tight text-brand')}>
                    {to12h(w.startTime)} – {to12h(w.endTime)}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
