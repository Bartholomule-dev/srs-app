import type { Skin, PathIndex } from './types';

/**
 * Number of recent skins to avoid (configurable)
 */
const RECENCY_WINDOW = 3;

/**
 * Select a skin for an exercise, avoiding recently used skins
 *
 * @param exerciseSlug - The exercise to find a skin for
 * @param recentSkins - Array of recently used skin IDs (most recent last)
 * @param index - The path index for lookups
 * @returns A compatible skin, or null if none available
 */
export function selectSkin(
  exerciseSlug: string,
  recentSkins: string[],
  index: PathIndex
): Skin | null {
  const compatibleSkinIds = index.exerciseToSkins.get(exerciseSlug);

  if (!compatibleSkinIds || compatibleSkinIds.length === 0) {
    return null;
  }

  // Get recent skins to avoid (last N)
  const toAvoid = new Set(recentSkins.slice(-RECENCY_WINDOW));

  // Filter to fresh skins
  const freshSkinIds = compatibleSkinIds.filter(id => !toAvoid.has(id));

  // Use fresh skins if available, otherwise fall back to all compatible
  const pool = freshSkinIds.length > 0 ? freshSkinIds : compatibleSkinIds;

  // Random selection from pool
  const selectedId = pool[Math.floor(Math.random() * pool.length)];

  return index.skins.get(selectedId) ?? null;
}

/**
 * Select skins for multiple exercises, trying to use the same skin
 * for exercises that share a blueprint
 *
 * @param exerciseSlugs - Array of exercise slugs
 * @param recentSkins - Recently used skin IDs
 * @param index - Path index
 * @returns Array of skins (or null) matching input order
 */
export function selectSkinForExercises(
  exerciseSlugs: string[],
  recentSkins: string[],
  index: PathIndex
): (Skin | null)[] {
  if (exerciseSlugs.length === 0) {
    return [];
  }

  // Find common skins across all exercises that have skin support
  const exercisesWithSkins = exerciseSlugs.filter(
    slug => (index.exerciseToSkins.get(slug)?.length ?? 0) > 0
  );

  if (exercisesWithSkins.length === 0) {
    return exerciseSlugs.map(() => null);
  }

  // Find intersection of compatible skins
  let commonSkinIds: Set<string> | null = null;

  for (const slug of exercisesWithSkins) {
    const skinIds = index.exerciseToSkins.get(slug) ?? [];
    if (commonSkinIds === null) {
      commonSkinIds = new Set(skinIds);
    } else {
      commonSkinIds = new Set(skinIds.filter(id => commonSkinIds!.has(id)));
    }
  }

  // If there's a common skin, use it for all exercises
  if (commonSkinIds && commonSkinIds.size > 0) {
    const toAvoid = new Set(recentSkins.slice(-RECENCY_WINDOW));
    const freshIds = [...commonSkinIds].filter(id => !toAvoid.has(id));
    const pool = freshIds.length > 0 ? freshIds : [...commonSkinIds];
    const selectedId = pool[Math.floor(Math.random() * pool.length)];
    const selectedSkin = index.skins.get(selectedId) ?? null;

    return exerciseSlugs.map(slug => {
      const hasSkinSupport = (index.exerciseToSkins.get(slug)?.length ?? 0) > 0;
      return hasSkinSupport ? selectedSkin : null;
    });
  }

  // No common skin - select individually
  return exerciseSlugs.map(slug => selectSkin(slug, recentSkins, index));
}

/**
 * Get the RECENCY_WINDOW value (for testing)
 */
export function getRecencyWindow(): number {
  return RECENCY_WINDOW;
}
