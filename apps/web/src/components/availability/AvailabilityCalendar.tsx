'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dateKeyFromParts, toDateKey } from '@/lib/time';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { WeeklyHourInput } from 'shared';
import type { DateOverride } from '@/types/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "09:00" → "9:00am", "17:30" → "5:30pm". */
function to12h(hm: string): string {
  const [h, m] = hm.split(':').map(Number);
  const period = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')}${period}`;
}

/**
 * Calendar view of an availability schedule (Calendly's "Calendar" tab). Projects
 * recurring weekly hours plus date-specific overrides onto a month grid so it
 * reflects everything saved in the List view. Today + future cells are clickable
 * — opening a small "Edit date" / "Edit all <Day>s" menu that drives quick edits
 * via the parent. Past cells are read-only.
 */
export function AvailabilityCalendar({
  hours,
  dateOverrides,
  timezone,
  onEditDate,
  onEditWeekday,
}: {
  hours: WeeklyHourInput[];
  dateOverrides: DateOverride[];
  timezone: string;
  /** Open the edit dialog for a single date (`YYYY-MM-DD`) — creates/updates a date override. */
  onEditDate: (dateKey: string) => void;
  /** Open the edit dialog for an entire day-of-week (0=Sun … 6=Sat). */
  onEditWeekday: (dayOfWeek: number) => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(new Date(), timezone);

  const weeklyByDay = (dow: number) =>
    hours
      .filter((h) => h.dayOfWeek === dow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  /** Resolve what a given date shows — date override beats weekly hours. */
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
              <div
                key={`b-${i}`}
                className="min-h-[92px] border-b border-r border-border bg-gray-50/50"
              />
            );
          const dow = new Date(year, month, day).getDay();
          const dateKey = dateKeyFromParts(year, month, day);
          const isPast = dateKey < todayKey;
          const { kind, windows } = resolveDay(dateKey, dow);

          const cellInner = (
            <>
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
            </>
          );

          // Past dates are read-only and visually darkened (matches Calendly's
          // calendar where past cells get a gray fill); today + future open the
          // quick-edit menu.
          if (isPast) {
            return (
              <div
                key={day}
                className="min-h-[92px] border-b border-r border-border bg-gray-100 p-1.5 text-muted-foreground"
              >
                {cellInner}
              </div>
            );
          }
          return (
            <DropdownMenu key={day}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Edit availability for ${dateKey}`}
                  className="block min-h-[92px] border-b border-r border-border p-1.5 text-left transition hover:bg-brand-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                >
                  {cellInner}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={2}>
                <DropdownMenuItem onClick={() => onEditDate(dateKey)}>
                  <Pencil className="h-4 w-4" /> Edit date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditWeekday(dow)}>
                  <Repeat className="h-4 w-4" /> Edit all {DAY_NAMES[dow]}s
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
    </div>
  );
}
