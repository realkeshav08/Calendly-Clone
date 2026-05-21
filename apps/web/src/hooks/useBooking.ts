'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Booking } from '@/types/api';
import type { CreateBookingInput, RescheduleBookingInput } from 'shared';

/** Public: creates a booking against a host's event. */
export function useCreateBooking(username: string, eventSlug: string) {
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      api.post<Booking>(`/api/public/${username}/${eventSlug}/book`, input),
  });
}

/** Public: fetch a single booking (confirmation / cancel / reschedule pages). */
export function usePublicBooking(id: string) {
  return useQuery({
    queryKey: ['public-booking', id],
    queryFn: () => api.get<Booking>(`/api/public/bookings/${id}`),
    enabled: Boolean(id),
  });
}

/** Public: cancel a booking via its shareable link. */
export function useCancelPublicBooking(id: string) {
  return useMutation({
    mutationFn: (reason?: string) =>
      api.post<Booking>(`/api/public/bookings/${id}/cancel`, { cancellationReason: reason }),
  });
}

/** Public: reschedule a booking to a new start time. */
export function useReschedulePublicBooking(id: string) {
  return useMutation({
    mutationFn: (input: RescheduleBookingInput) =>
      api.post<Booking>(`/api/public/bookings/${id}/reschedule`, input),
  });
}
