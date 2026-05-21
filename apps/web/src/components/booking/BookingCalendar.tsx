'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dateKeyFromParts, toDateKey } from '@/lib/time';

interface BookingCalendarProps {
  /** First day of the month being viewed. */
  viewMonth: Date;
  onMonthChange: (next: Date) => void;
  /** Map of YYYY-MM-DD → hasSlots, from the month-availability endpoint. */
  availability: Record<string, boolean> | undefined;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  timezone: string;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Lightweight month calendar built with date-fns primitives (no heavy calendar
 * lib). Days with availability are clickable and highlighted; the selected day is
 * solid blue; past/unavailable days are muted and disabled. Today gets a ring.
 */
export function BookingCalendar({
  viewMonth,
  onMonthChange,
  availability,
  selectedDate,
  onSelectDate,
  timezone,
}: BookingCalendarProps) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date(), timezone);

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Leading blanks to align the 1st under the correct weekday, then the days.
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonthChange(new Date(year, month - 1, 1))}
            className="rounded-full p-2 text-muted-foreground hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onMonthChange(new Date(year, month + 1, 1))}
            className="rounded-full p-2 text-muted-foreground hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const key = dateKeyFromParts(year, month, day);
          const hasSlots = availability?.[key] ?? false;
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;

          return (
            <div key={key} className="flex justify-center py-0.5">
              <button
                type="button"
                disabled={!hasSlots}
                onClick={() => onSelectDate(key)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition',
                  isSelected && 'bg-brand text-white',
                  !isSelected && hasSlots && 'bg-brand-soft text-brand hover:bg-blue-100',
                  !hasSlots && 'cursor-default text-gray-300',
                  isToday && !isSelected && 'ring-1 ring-brand ring-offset-1',
                )}
                aria-label={key}
                aria-pressed={isSelected}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
