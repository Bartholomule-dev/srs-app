'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface UseActiveLanguageReturn {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useActiveLanguage(): UseActiveLanguageReturn {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['activeLanguage', user?.id],
    queryFn: async () => {
      if (!user) return 'python';

      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.preferred_language ?? 'python';
    },
    enabled: !authLoading,
    staleTime: 60_000,
  });

  const setLanguage = async (language: string): Promise<void> => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_language: language })
      .eq('id', user.id);

    if (error) throw error;

    // Invalidate all language-dependent queries
    await queryClient.invalidateQueries({ queryKey: ['activeLanguage'] });
    await queryClient.invalidateQueries({ queryKey: ['dueCount'] });
    await queryClient.invalidateQueries({ queryKey: ['subconcept-progress'] });
    await queryClient.invalidateQueries({ queryKey: ['skillTree'] });
    await queryClient.invalidateQueries({ queryKey: ['languageStats'] });
  };

  return {
    language: query.data ?? 'python',
    setLanguage,
    isLoading: authLoading || query.isLoading,
    error: query.error as Error | null,
  };
}
