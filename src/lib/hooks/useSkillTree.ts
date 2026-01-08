'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';
import { buildSkillTreeData } from '@/lib/skill-tree/build-tree';
import type { SkillTreeData, SubconceptState } from '@/lib/skill-tree/types';
import type { SubconceptProgress, ConceptSlug } from '@/lib/curriculum/types';

interface DbSubconceptProgress {
  id: string;
  user_id: string;
  subconcept_slug: string;
  concept_slug: string;
  stability: number;
  difficulty: number;
  fsrs_state: number;
  reps: number;
  lapses: number;
  elapsed_days: number;
  scheduled_days: number;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbToProgress(db: DbSubconceptProgress): SubconceptProgress {
  return {
    id: db.id,
    userId: db.user_id,
    subconceptSlug: db.subconcept_slug,
    conceptSlug: db.concept_slug as ConceptSlug,
    stability: db.stability,
    difficulty: db.difficulty,
    fsrsState: db.fsrs_state as 0 | 1 | 2 | 3,
    reps: db.reps,
    lapses: db.lapses,
    elapsedDays: db.elapsed_days,
    scheduledDays: db.scheduled_days,
    nextReview: new Date(db.next_review),
    lastReviewed: db.last_reviewed ? new Date(db.last_reviewed) : null,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

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
        mapDbToProgress(row as DbSubconceptProgress)
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
