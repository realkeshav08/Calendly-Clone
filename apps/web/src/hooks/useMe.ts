'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types/api';
import type { UpdateUserInput } from 'shared';

/** Fetches the current (seeded) user shown in the sidebar and used for defaults. */
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api.get<User>('/api/me') });
}

/** Updates the current user's profile (name/username/timezone). */
export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => api.patch<User>('/api/me', input),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}
