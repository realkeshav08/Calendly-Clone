'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dateKeyFromParts } from '@/lib/time';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

interface DateRangePickerProps {
  onApply: (range: DateRange) => void;
  onCancel: () => void;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** Renders one month grid; days are clickable to build a range. */
function MonthGrid({
  base,
  inRange,
  isEdge,
  onPick,
}: {
  base: Date;
  inRange: (key: string) => boolean;
  isEdge: (key: string) => boolean;
  onPick: (key: string) => void;
}) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  return (
    <div>
      <p className="mb-3 text-center text-base font-semibold text-foreground">
        {base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`b-${i}`} />;
          const key = dateKeyFromParts(year, month, day);
          const edge = isEdge(key);
          const within = inRange(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              className={cn(
                'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm',
                edge && 'bg-brand font-semibold text-white',
                !edge && within && 'bg-brand-soft text-brand',
                !edge && !within && 'text-foreground hover:bg-gray-100',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Calendly's "Date Range" picker: quick presets plus a two-month range selection
 * with Apply/Cancel. The first click sets the start, the second sets the end.
 */
export function DateRangePicker({ onApply, onCancel }: DateRangePickerProps) {
  const today = new Date();
  const [leftMonth, setLeftMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  const rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1);

  function pick(key: string) {
    if (!start || (start && end)) {
      setStart(key);
      setEnd(null);
    } else if (key >= start) {
      setEnd(key);
    } else {
      setStart(key);
    }
  }

  const inRange = (key: string) => Boolean(start && end && key > start && key < end);
  const isEdge = (key: string) => key === start || key === end;

  function applyPreset(preset: 'today' | 'week' | 'month' | 'all') {
    const d = new Date();
    const iso = (x: Date) => dateKeyFromParts(x.getFullYear(), x.getMonth(), x.getDate());
    if (preset === 'today') onApply({ from: iso(d), to: iso(d) });
    else if (preset === 'week') {
      const s = new Date(d);
      s.setDate(d.getDate() - d.getDay());
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      onApply({ from: iso(s), to: iso(e) });
    } else if (preset === 'month') {
      onApply({
        from: dateKeyFromParts(d.getFullYear(), d.getMonth(), 1),
        to: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
      });
    } else onApply({ from: '1970-01-01', to: '2999-12-31' });
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-md">
      <div className="mb-4 flex flex-wrap gap-5 text-sm font-medium text-brand">
        <button type="button" onClick={() => applyPreset('today')}>Today</button>
        <button type="button" onClick={() => applyPreset('week')}>This week</button>
        <button type="button" onClick={() => applyPreset('month')}>This month</button>
        <button type="button" onClick={() => applyPreset('all')}>All time</button>
      </div>

      <div className="relative flex flex-col gap-8 sm:flex-row">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() - 1, 1))}
          className="absolute left-0 top-0 rounded-full p-1 text-muted-foreground hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1))}
          className="absolute right-0 top-0 rounded-full p-1 text-muted-foreground hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <MonthGrid base={leftMonth} inRange={inRange} isEdge={isEdge} onPick={pick} />
        <MonthGrid base={rightMonth} inRange={inRange} isEdge={isEdge} onPick={pick} />
      </div>

      <div className="mt-5 flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted-foreground">
          Cancel
        </button>
        <Button
          className="rounded-full px-6"
          disabled={!start}
          onClick={() => start && onApply({ from: start, to: end ?? start })}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
