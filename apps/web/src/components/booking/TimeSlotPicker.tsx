'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatSlotTime } from '@/lib/time';
import { Skeleton } from '@/components/ui/skeleton';

interface TimeSlotPickerProps {
  slots: string[] | undefined;
  isLoading: boolean;
  timezone: string;
  /** Long label of the selected date, shown as the column header. */
  dateLabel: string;
  onConfirm: (iso: string) => void;
}

/**
 * Vertical list of bookable times. Reproduces Calendly's signature interaction:
 * clicking a slot doesn't navigate immediately — instead the row splits into the
 * time (left) and a blue "Confirm" button (right). Confirming advances to the form.
 */
export function TimeSlotPicker({
  slots,
  isLoading,
  timezone,
  dateLabel,
  onConfirm,
}: TimeSlotPickerProps) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-foreground">{dateLabel}</h3>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {!isLoading && slots && slots.length === 0 && (
        <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No times available on this day.
        </p>
      )}

      {!isLoading && slots && slots.length > 0 && (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {slots.map((iso) => {
            const isActive = active === iso;
            return (
              <li key={iso} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActive(iso)}
                  className={cn(
                    'h-12 rounded-md border text-sm font-semibold transition-all',
                    isActive
                      ? 'flex-1 border-gray-400 bg-gray-700 text-white'
                      : 'w-full border-brand/40 text-brand hover:border-brand',
                  )}
                  aria-label={`Select ${formatSlotTime(iso, timezone)}`}
                >
                  {formatSlotTime(iso, timezone)}
                </button>
                {isActive && (
                  <button
                    type="button"
                    onClick={() => onConfirm(iso)}
                    className="h-12 flex-1 rounded-md bg-brand text-sm font-semibold text-white transition hover:bg-brand-hover animate-in fade-in slide-in-from-right-2"
                  >
                    Confirm
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
