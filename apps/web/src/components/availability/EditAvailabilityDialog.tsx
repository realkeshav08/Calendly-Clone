'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** What the dialog reads/writes — one time window per edit, plus an unavailable toggle. */
export interface EditValues {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isUnavailable: boolean;
}

interface Props {
  open: boolean;
  /** Header text, e.g. "Edit Tuesday, May 26" or "Edit all Tuesdays". */
  title: string;
  /** Existing hours (or sensible defaults) for the chosen target. */
  prefill: EditValues;
  isPending?: boolean;
  onClose: () => void;
  onApply: (values: EditValues) => void;
}

/**
 * Shared dialog used by the Availability calendar to edit either a single date
 * (creates/updates a date override) or every occurrence of a weekday (replaces
 * the schedule's weekly hours for that day-of-week). Multi-window editing stays
 * in the List view's full editor; this is the quick-edit affordance Calendly
 * exposes from the calendar grid.
 */
export function EditAvailabilityDialog({
  open,
  title,
  prefill,
  isPending,
  onClose,
  onApply,
}: Props) {
  const [values, setValues] = useState<EditValues>(prefill);

  // Reset local state whenever the dialog opens or the target changes.
  useEffect(() => {
    if (open) setValues(prefill);
  }, [open, prefill]);

  const valid = values.isUnavailable || values.startTime < values.endTime;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.isUnavailable}
              onChange={(e) => setValues((v) => ({ ...v, isUnavailable: e.target.checked }))}
            />
            Unavailable all day
          </label>

          {!values.isUnavailable && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start" className="text-xs">Start</Label>
                <Input
                  id="start"
                  type="time"
                  value={values.startTime}
                  onChange={(e) => setValues((v) => ({ ...v, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end" className="text-xs">End</Label>
                <Input
                  id="end"
                  type="time"
                  value={values.endTime}
                  onChange={(e) => setValues((v) => ({ ...v, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}
          {!values.isUnavailable && !valid && (
            <p className="text-xs text-destructive">End time must be after start time.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => onApply(values)} disabled={!valid || isPending}>
            {isPending ? 'Saving…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
