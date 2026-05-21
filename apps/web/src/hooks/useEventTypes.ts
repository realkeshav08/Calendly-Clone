'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventType } from '@/types/api';
import type { CreateEventTypeInput, UpdateEventTypeInput } from 'shared';

const KEY = ['event-types'];

export function useEventTypes() {
  return useQuery({ queryKey: KEY, queryFn: () => api.get<EventType[]>('/api/event-types') });
}

export function useEventType(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get<EventType>(`/api/event-types/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventTypeInput) => api.post<EventType>('/api/event-types', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEventType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEventTypeInput) =>
      api.patch<EventType>(`/api/event-types/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Toggles an event type's active flag with an optimistic update: the switch flips
 * instantly, and we roll back to the previous cache if the request fails.
 */
export function useToggleEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<EventType>(`/api/event-types/${id}`, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<EventType[]>(KEY);
      qc.setQueryData<EventType[]>(KEY, (old) =>
        old?.map((e) => (e.id === id ? { ...e, isActive } : e)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Deletes an event type with an optimistic removal from the list. */
export function useDeleteEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/event-types/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<EventType[]>(KEY);
      qc.setQueryData<EventType[]>(KEY, (old) => old?.filter((e) => e.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
