'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { mapProfile, toDbProfileUpdate } from '@/lib/supabase/mappers';
import type { Profile, DbProfile } from '@/lib/types';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>) => Promise<Profile>;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
        setError(new Error(fetchError.message));
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

  const refetch = useCallback(async () => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>): Promise<Profile> => {
      if (!user) {
        throw new Error('Must be authenticated to update profile');
      }

      const dbUpdates = toDbProfileUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const updatedProfile = mapProfile(data as DbProfile);
      setProfile(updatedProfile);
      return updatedProfile;
    },
    [user]
  );

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch,
  };
}
