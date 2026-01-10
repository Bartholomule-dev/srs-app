'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface UseDueCountReturn {
  dueCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDueCount(userId: string | undefined): UseDueCountReturn {
  const query = useQuery({
    queryKey: ['dueCount', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { data, error } = await supabase
        .from('subconcept_progress')
        .select('next_review')
        .eq('user_id', userId);

      if (error) throw error;

      const now = new Date();
      return (data ?? []).filter((p) => {
        if (!p.next_review) return false;
        return new Date(p.next_review) <= now;
      }).length;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  return {
    dueCount: query.data ?? 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
