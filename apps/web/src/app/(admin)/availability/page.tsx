'use client';

import { useEffect, useState } from 'react';
import { Check, List, CalendarDays, MoreVertical, Pencil, Copy } from 'lucide-react';
import { WeeklyHoursEditor } from '@/components/availability/WeeklyHoursEditor';
import { DateOverridesEditor } from '@/components/availability/DateOverridesEditor';
import { AvailabilityCalendar } from '@/components/availability/AvailabilityCalendar';
import {
  EditAvailabilityDialog,
  type EditValues,
} from '@/components/availability/EditAvailabilityDialog';
import { TimezoneSelect } from '@/components/availability/TimezoneSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendlyLoader } from '@/components/ui/calendly-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useSchedules,
  useUpdateSchedule,
  useCreateSchedule,
  useAddDateOverride,
} from '@/hooks/useAvailability';
import { useEventTypes } from '@/hooks/useEventTypes';
import { cn } from '@/lib/utils';
import type { WeeklyHourInput } from 'shared';

const TABS = ['Schedules'] as const;

export default function AvailabilityPage() {
  const { data: schedules, isLoading, isError } = useSchedules();
  const { data: eventTypes } = useEventTypes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [hours, setHours] = useState<WeeklyHourInput[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [saved, setSaved] = useState(false);

  const selected = schedules?.find((s) => s.id === selectedId) ?? schedules?.[0];
  const update = useUpdateSchedule(selected?.id ?? '');
  const createSchedule = useCreateSchedule();
  const addOverride = useAddDateOverride(selected?.id ?? '');
  const activeOn = eventTypes?.filter((e) => e.scheduleId === selected?.id).length ?? 0;

  // ---- Quick-edit (from Calendar view) state --------------------------------
  const [editOpen, setEditOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<{
    mode: 'date' | 'weekday';
    target: string | number;
    title: string;
    prefill: EditValues;
  } | null>(null);

  const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /** Pre-fill for editing a single date: existing override > weekly hours > default. */
  function buildDatePrefill(dateKey: string): EditValues {
    const override = selected?.dateOverrides.find((o) => o.date.slice(0, 10) === dateKey);
    if (override) {
      if (override.isUnavailable || !override.startTime || !override.endTime) {
        return { startTime: '09:00', endTime: '17:00', isUnavailable: true };
      }
      return { startTime: override.startTime, endTime: override.endTime, isUnavailable: false };
    }
    const [y, m, d] = dateKey.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    const weekly = hours
      .filter((h) => h.dayOfWeek === dow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    return weekly
      ? { startTime: weekly.startTime, endTime: weekly.endTime, isUnavailable: false }
      : { startTime: '09:00', endTime: '17:00', isUnavailable: false };
  }

  /** Pre-fill for editing a weekday: first existing window > unavailable if none. */
  function buildWeekdayPrefill(dow: number): EditValues {
    const weekly = hours
      .filter((h) => h.dayOfWeek === dow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    return weekly
      ? { startTime: weekly.startTime, endTime: weekly.endTime, isUnavailable: false }
      : { startTime: '09:00', endTime: '17:00', isUnavailable: true };
  }

  function handleEditDate(dateKey: string) {
    if (!selected) return;
    const [y, m, d] = dateKey.split('-').map(Number);
    const long = new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    setEditConfig({
      mode: 'date',
      target: dateKey,
      title: `Edit ${long}`,
      prefill: buildDatePrefill(dateKey),
    });
    setEditOpen(true);
  }

  function handleEditWeekday(dow: number) {
    if (!selected) return;
    setEditConfig({
      mode: 'weekday',
      target: dow,
      title: `Edit all ${DAY_LONG[dow]}s`,
      prefill: buildWeekdayPrefill(dow),
    });
    setEditOpen(true);
  }

  /**
   * Apply quick-edit changes. For a single date we upsert a date override
   * (overrides win over weekly hours per the slot-generation precedence); for a
   * weekday we replace every entry for that day-of-week with the new window.
   */
  async function handleApply(values: EditValues) {
    if (!editConfig || !selected) return;
    if (editConfig.mode === 'date') {
      await addOverride.mutateAsync({
        date: editConfig.target as string,
        isUnavailable: values.isUnavailable,
        startTime: values.isUnavailable ? null : values.startTime,
        endTime: values.isUnavailable ? null : values.endTime,
      });
    } else {
      const dow = editConfig.target as number;
      const others = hours.filter((h) => h.dayOfWeek !== dow);
      const next = values.isUnavailable
        ? others
        : [
            ...others,
            { dayOfWeek: dow, startTime: values.startTime, endTime: values.endTime },
          ];
      await update.mutateAsync({ weeklyHours: next });
      setHours(next);
    }
    setEditOpen(false);
  }

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  function openRename() {
    setRenameValue(selected?.name ?? '');
    setRenameOpen(true);
  }

  /** Rename the current schedule; invalidating the query syncs the selector,
   * header, and the event-type form's schedule picker everywhere. */
  async function doRename() {
    const name = renameValue.trim();
    if (!selected || !name) return;
    await update.mutateAsync({ name });
    setRenameOpen(false);
  }

  /** Duplicate the current schedule (name + timezone + weekly hours) and switch to it. */
  function doDuplicate() {
    if (!selected) return;
    createSchedule.mutate(
      {
        name: `${selected.name} (copy)`,
        timezone: selected.timezone,
        isDefault: false,
        weeklyHours: selected.weeklyHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
        })),
      },
      { onSuccess: (created) => setSelectedId(created.id) },
    );
  }

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

  return (
    <div className="md:pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Availability</h1>

      <div className="mb-6 mt-4 flex gap-6 border-b border-border">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              'relative cursor-default pb-3 text-sm font-medium',
              i === 0 ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            {tab}
            {i === 0 && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
          </span>
        ))}
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load availability</AlertTitle>
          <AlertDescription>Make sure the API is running, then try again.</AlertDescription>
        </Alert>
      ) : isLoading || !selected ? (
        <CalendlyLoader />
      ) : (
        <div className="rounded-xl border border-border bg-white">
          {/* Schedule header */}
          <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Schedule</p>
              <div className="mt-1 w-60">
                <Select value={selected.id} onValueChange={setSelectedId}>
                  <SelectTrigger aria-label="Select schedule" className="border-0 px-0 text-lg font-bold text-brand shadow-none focus:ring-0">
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
              <p className="mt-1 text-sm text-brand">
                Active on: {activeOn} event type{activeOn === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
                    view === 'list' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <List className="h-4 w-4" /> List
                </button>
                <button
                  type="button"
                  onClick={() => setView('calendar')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
                    view === 'calendar' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <CalendarDays className="h-4 w-4" /> Calendar
                </button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Schedule options"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreVertical className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openRename}>
                    <Pencil className="h-4 w-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={doDuplicate}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="p-6">
            {view === 'list' ? (
              <div className="space-y-8">
                <div className="flex justify-end">
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
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">Weekly hours</h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Set when you are typically available for meetings.
                    </p>
                    <WeeklyHoursEditor value={hours} onChange={setHours} />
                    <div className="mt-4 w-56">
                      <TimezoneSelect value={timezone} onChange={setTimezone} withIcon />
                    </div>
                  </div>
                  <div className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <DateOverridesEditor schedule={selected} />
                  </div>
                </div>
              </div>
            ) : (
              <AvailabilityCalendar
                hours={hours}
                dateOverrides={selected.dateOverrides}
                timezone={timezone}
                onEditDate={handleEditDate}
                onEditWeekday={handleEditWeekday}
              />
            )}
          </div>
        </div>
      )}

      {editConfig && (
        <EditAvailabilityDialog
          open={editOpen}
          title={editConfig.title}
          prefill={editConfig.prefill}
          isPending={addOverride.isPending || update.isPending}
          onClose={() => setEditOpen(false)}
          onApply={handleApply}
        />
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="schedule-name">Schedule name</Label>
            <Input
              id="schedule-name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void doRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doRename} disabled={!renameValue.trim() || update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

