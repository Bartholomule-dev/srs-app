'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { mapProfile, toDbProfileUpdate } from '@/lib/supabase/mappers';
import { handleSupabaseError } from '@/lib/errors';
import type { Profile, DbProfile, ExperienceLevel } from '@/lib/types';
import type { AppError } from '@/lib/errors';

/** Query key for profile data */
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
};

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw handleSupabaseError(error);
  }

  return mapProfile(data as DbProfile);
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: AppError | null;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>) => Promise<Profile>;
  updateExperienceLevel: (level: ExperienceLevel) => Promise<void>;
  refetch: () => void;
}

export function useProfile(): UseProfileReturn {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: profileKeys.detail(user?.id ?? ''),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user && !authLoading,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>) => {
      if (!user) {
        throw handleSupabaseError(new Error('Must be authenticated to update profile'));
      }

      const dbUpdates = toDbProfileUpdate(updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return mapProfile(data as DbProfile);
    },
    onSuccess: (updatedProfile) => {
      // Update cache with new profile data
      queryClient.setQueryData(profileKeys.detail(user!.id), updatedProfile);
    },
  });

  const experienceLevelMutation = useMutation({
    mutationFn: async (level: ExperienceLevel) => {
      const profile = query.data;
      if (!profile) {
        throw new Error('No profile loaded');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ experience_level: level })
        .eq('id', profile.id);

      if (error) {
        throw handleSupabaseError(error);
      }

      return level;
    },
    onSuccess: (level) => {
      // Optimistically update cache
      queryClient.setQueryData(
        profileKeys.detail(user!.id),
        (old: Profile | undefined) => (old ? { ...old, experienceLevel: level } : old)
      );
    },
    onError: (error) => {
      console.error('Failed to update experience level:', error);
    },
  });

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>): Promise<Profile> => {
      return updateMutation.mutateAsync(updates);
    },
    [updateMutation]
  );

  const updateExperienceLevel = useCallback(
    async (level: ExperienceLevel) => {
      await experienceLevelMutation.mutateAsync(level);
    },
    [experienceLevelMutation]
  );

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    profile: query.data ?? null,
    loading: authLoading || query.isLoading,
    error: query.error as AppError | null,
    updateProfile,
    updateExperienceLevel,
    refetch,
  };
}
