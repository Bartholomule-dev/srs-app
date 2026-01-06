'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { mapProfile, toDbProfileUpdate } from '@/lib/supabase/mappers';
import { handleSupabaseError } from '@/lib/errors';
import type { Profile, DbProfile, ExperienceLevel } from '@/lib/types';
import type { AppError } from '@/lib/errors';

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Track fetch trigger for refetch functionality
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    // Only fetch profile when auth is done loading
    if (authLoading) {
      return;
    }

    // Use an IIFE to handle the async operation
    let cancelled = false;

    (async () => {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      if (fetchError) {
        setError(handleSupabaseError(fetchError));
        setProfile(null);
      } else if (data) {
        setProfile(mapProfile(data as DbProfile));
      }

      setProfileLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, fetchTrigger]);

  // Loading is true if auth is loading OR profile is loading
  const loading = authLoading || profileLoading;

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>): Promise<Profile> => {
      if (!user) {
        throw handleSupabaseError(new Error('Must be authenticated to update profile'));
      }

      const dbUpdates = toDbProfileUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw handleSupabaseError(updateError);
      }

      const updatedProfile = mapProfile(data as DbProfile);
      setProfile(updatedProfile);
      return updatedProfile;
    },
    [user]
  );

  const updateExperienceLevel = useCallback(
    async (level: ExperienceLevel) => {
      if (!profile) return;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ experience_level: level })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Failed to update experience level:', updateError);
        return;
      }

      // Optimistically update local state
      setProfile((prev) => (prev ? { ...prev, experienceLevel: level } : null));
    },
    [profile]
  );

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateExperienceLevel,
    refetch,
  };
}
