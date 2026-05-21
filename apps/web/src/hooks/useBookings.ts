'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Booking } from '@/types/api';

/** Admin meetings list filtered by upcoming/past. */
export function useBookings(filter: 'upcoming' | 'past') {
  return useQuery({
    queryKey: ['bookings', filter],
    queryFn: () => api.get<Booking[]>(`/api/bookings?filter=${filter}`),
  });
}

/** Admin cancel from the meetings page, optimistically removing it from the list. */
export function useCancelBooking(filter: 'upcoming' | 'past') {
  const qc = useQueryClient();
  const key = ['bookings', filter];
  return useMutation({
    mutationFn: (id: string) => api.del<Booking>(`/api/bookings/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Booking[]>(key);
      qc.setQueryData<Booking[]>(key, (old) => old?.filter((b) => b.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
