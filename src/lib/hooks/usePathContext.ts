'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PathIndex, SkinnedCard } from '@/lib/paths/types';
import { getPathIndex } from '@/lib/paths/loader';
import { selectSkin } from '@/lib/paths/selector';
import { applySkinContext } from '@/lib/paths/apply-skin';

export interface UsePathContextReturn {
  /** The path index (blueprints, skins, lookup maps) */
  index: PathIndex | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Get skinned card info for an exercise */
  getSkinnedCard: (exerciseSlug: string, recentSkins: string[]) => SkinnedCard;
}

/**
 * Hook to access path context (blueprints, skins) in React components.
 *
 * Loads the path index on mount and provides a helper function to create
 * SkinnedCards that combine exercise, blueprint, and skin information.
 *
 * @example
 * ```tsx
 * function ExerciseView({ exerciseSlug }: { exerciseSlug: string }) {
 *   const { getSkinnedCard, loading } = usePathContext();
 *
 *   if (loading) return <LoadingSpinner />;
 *
 *   const card = getSkinnedCard(exerciseSlug, recentSkins);
 *   // card.context has the skin's domain-specific explanation
 *   // card.beat and card.totalBeats show progress in blueprint
 * }
 * ```
 */
export function usePathContext(): UsePathContextReturn {
  const [index, setIndex] = useState<PathIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const pathIndex = await getPathIndex();
        if (!cancelled) {
          setIndex(pathIndex);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load paths'));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const getSkinnedCard = useCallback(
    (exerciseSlug: string, recentSkins: string[]): SkinnedCard => {
      if (!index) {
        // Return minimal card if index not loaded
        return {
          exerciseSlug,
          skinId: null,
          blueprintId: null,
          beat: null,
          totalBeats: null,
          beatTitle: null,
          context: null,
        };
      }

      const skin = selectSkin(exerciseSlug, recentSkins, index);
      return applySkinContext(exerciseSlug, skin?.id ?? null, index);
    },
    [index]
  );

  return {
    index,
    loading,
    error,
    getSkinnedCard,
  };
}
