'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';
import { buildSkillTreeData } from '@/lib/skill-tree/build-tree';
import type { SkillTreeData, SubconceptState } from '@/lib/skill-tree/types';
import type { SubconceptProgress } from '@/lib/curriculum/types';
import type { DbSubconceptProgress } from '@/lib/types';
import { mapDbToSubconceptProgress } from '@/lib/types';

export interface UseSkillTreeReturn {
  data: SkillTreeData | null;
  loading: boolean;
  error: string | null;
  getState: (slug: string) => SubconceptState;
  refetch: () => Promise<void>;
}

export function useSkillTree(): UseSkillTreeReturn {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<SkillTreeData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData(null);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setError(null);

    try {
      const { data: progressData, error: fetchError } = await supabase
        .from('subconcept_progress')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const progress = (progressData ?? []).map((row) =>
        mapDbToSubconceptProgress(row as DbSubconceptProgress)
      );
      const treeData = buildSkillTreeData(progress);
      setData(treeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill tree');
      setData(null);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    fetchData();
  }, [fetchData, authLoading]);

  // Loading is true if auth is loading OR data is loading
  const loading = authLoading || dataLoading;

  // Memoize state lookup map for getState
  const stateMap = useMemo(() => {
    if (!data) return new Map<string, SubconceptState>();

    const map = new Map<string, SubconceptState>();
    for (const cluster of data.clusters) {
      for (const subconcept of cluster.subconcepts) {
        map.set(subconcept.slug, subconcept.state);
      }
    }
    return map;
  }, [data]);

  const getState = useCallback(
    (slug: string): SubconceptState => {
      return stateMap.get(slug) ?? 'locked';
    },
    [stateMap]
  );

  return {
    data,
    loading,
    error,
    getState,
    refetch: fetchData,
  };
}
