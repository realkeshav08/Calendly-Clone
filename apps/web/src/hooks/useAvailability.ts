'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AvailabilitySchedule } from '@/types/api';
import type { CreateScheduleInput, UpdateScheduleInput, DateOverrideInput } from 'shared';

const KEY = ['schedules'];

export function useSchedules() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<AvailabilitySchedule[]>('/api/schedules'),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScheduleInput) =>
      api.post<AvailabilitySchedule>('/api/schedules', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSchedule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateScheduleInput) =>
      api.patch<AvailabilitySchedule>(`/api/schedules/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddDateOverride(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DateOverrideInput) =>
      api.post(`/api/schedules/${scheduleId}/date-overrides`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDateOverride(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (overrideId: string) =>
      api.del<void>(`/api/schedules/${scheduleId}/date-overrides/${overrideId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
