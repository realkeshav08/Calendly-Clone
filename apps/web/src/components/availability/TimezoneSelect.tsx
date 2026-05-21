'use client';

import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COMMON_TIMEZONES } from '@/lib/constants';

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  /** Show a globe icon prefix (used on the booking page). */
  withIcon?: boolean;
}

/**
 * Timezone picker backed by a curated list of common IANA zones. If the current
 * value isn't in the list (e.g. an auto-detected zone), it's prepended so the
 * selection always renders correctly.
 */
export function TimezoneSelect({ value, onChange, withIcon }: TimezoneSelectProps) {
  const options = COMMON_TIMEZONES.includes(value as (typeof COMMON_TIMEZONES)[number])
    ? COMMON_TIMEZONES
    : [value, ...COMMON_TIMEZONES];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Timezone">
        <span className="flex items-center gap-2">
          {withIcon && <Globe className="h-4 w-4 text-muted-foreground" />}
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz.replace(/_/g, ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
