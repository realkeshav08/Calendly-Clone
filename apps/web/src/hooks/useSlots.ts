'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PublicEvent, PublicProfile } from '@/types/api';

/** Public host profile + active events for the /:username landing page. */
export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => api.get<PublicProfile>(`/api/public/${username}`),
  });
}

/** Public event details for the booking page. */
export function usePublicEvent(username: string, eventSlug: string) {
  return useQuery({
    queryKey: ['public-event', username, eventSlug],
    queryFn: () => api.get<PublicEvent>(`/api/public/${username}/${eventSlug}`),
  });
}

/** Available start times (UTC ISO) for a specific date and invitee timezone. */
export function useSlots(
  username: string,
  eventSlug: string,
  date: string | null,
  timezone: string,
) {
  return useQuery({
    queryKey: ['slots', username, eventSlug, date, timezone],
    queryFn: () =>
      api.get<string[]>(
        `/api/public/${username}/${eventSlug}/slots?date=${date}&timezone=${encodeURIComponent(timezone)}`,
      ),
    enabled: Boolean(date),
  });
}

/** Map of YYYY-MM-DD → hasSlots for the calendar's available-day indicators. */
export function useMonthAvailability(
  username: string,
  eventSlug: string,
  month: string,
  timezone: string,
) {
  return useQuery({
    queryKey: ['month-availability', username, eventSlug, month, timezone],
    queryFn: () =>
      api.get<Record<string, boolean>>(
        `/api/public/${username}/${eventSlug}/month-availability?month=${month}&timezone=${encodeURIComponent(timezone)}`,
      ),
  });
}
