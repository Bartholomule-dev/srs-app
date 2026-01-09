import type { Skin, PathIndex } from './types';

/**
 * Number of recent skins to avoid (configurable)
 */
const RECENCY_WINDOW = 3;

/**
 * Get IDs of global skins (skins without blueprints restriction).
 * Global skins are available for ALL exercises.
 */
function getGlobalSkinIds(index: PathIndex): string[] {
  const globalIds: string[] = [];
  for (const [id, skin] of index.skins) {
    // Global skins have no blueprints field or empty blueprints array
    if (!skin.blueprints || skin.blueprints.length === 0) {
      globalIds.push(id);
    }
  }
  return globalIds;
}

/**
 * Get all candidate skin IDs for an exercise.
 * Combines blueprint-specific skins with global skins.
 */
function getCandidateSkinIds(exerciseSlug: string, index: PathIndex): string[] {
  const blueprintSpecificIds = index.exerciseToSkins.get(exerciseSlug) ?? [];
  const globalIds = getGlobalSkinIds(index);

  // Combine and dedupe (in case a skin is in both lists somehow)
  const allIds = [...blueprintSpecificIds];
  for (const id of globalIds) {
    if (!allIds.includes(id)) {
      allIds.push(id);
    }
  }
  return allIds;
}

/**
 * Select a skin for an exercise, avoiding recently used skins.
 * Includes both blueprint-specific skins and global skins.
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
  // Get all candidate skins (blueprint-specific + global)
  const candidateSkinIds = getCandidateSkinIds(exerciseSlug, index);

  if (candidateSkinIds.length === 0) {
    return null;
  }

  // Get recent skins to avoid (last N)
  const toAvoid = new Set(recentSkins.slice(-RECENCY_WINDOW));

  // Filter to fresh skins
  const freshSkinIds = candidateSkinIds.filter(id => !toAvoid.has(id));

  // Use fresh skins if available, otherwise fall back to all compatible
  const pool = freshSkinIds.length > 0 ? freshSkinIds : candidateSkinIds;

  // Random selection from pool
  const selectedId = pool[Math.floor(Math.random() * pool.length)];

  return index.skins.get(selectedId) ?? null;
}

/**
 * Select a skin from a pool of IDs, avoiding recently used ones
 */
function pickSkinFromPool(
  skinIds: string[],
  recentSkins: string[],
  index: PathIndex
): Skin | null {
  if (skinIds.length === 0) return null;

  const toAvoid = new Set(recentSkins.slice(-RECENCY_WINDOW));
  const freshIds = skinIds.filter(id => !toAvoid.has(id));
  const pool = freshIds.length > 0 ? freshIds : skinIds;
  const selectedId = pool[Math.floor(Math.random() * pool.length)];
  return index.skins.get(selectedId) ?? null;
}

/**
 * Select skins for multiple exercises, ensuring same skin is used
 * for all exercises within the same blueprint.
 *
 * Algorithm:
 * 1. Group exercises by blueprint (exercises can be in multiple blueprints)
 * 2. For each blueprint group, find compatible skins and pick one
 * 3. Track used skins for recency (within this selection batch)
 * 4. For standalone exercises (not in any blueprint), select individually
 *
 * @param exerciseSlugs - Array of exercise slugs
 * @param recentSkins - Recently used skin IDs (most recent last)
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

  // Result array - same order as input
  const result: (Skin | null)[] = new Array(exerciseSlugs.length).fill(null);

  // Track which exercises we've assigned skins to
  const assigned = new Set<number>();

  // Build recency list that includes recently selected skins in this batch
  let batchRecency = [...recentSkins];

  // Group exercises by blueprint
  // Map: blueprintId -> [{ index, slug }]
  const blueprintGroups = new Map<string, { index: number; slug: string }[]>();

  for (let i = 0; i < exerciseSlugs.length; i++) {
    const slug = exerciseSlugs[i];
    const bpRefs = index.exerciseToBlueprints.get(slug);

    if (bpRefs && bpRefs.length > 0) {
      // Use first blueprint (exercise may be in multiple)
      const bpId = bpRefs[0].blueprintId;
      if (!blueprintGroups.has(bpId)) {
        blueprintGroups.set(bpId, []);
      }
      blueprintGroups.get(bpId)!.push({ index: i, slug });
    }
  }

  // Process each blueprint group
  for (const [_bpId, group] of blueprintGroups) {
    // Find skins compatible with ALL exercises in this group
    // Include both blueprint-specific skins and global skins
    let commonSkinIds: Set<string> | null = null;

    for (const { slug } of group) {
      const skinIds = getCandidateSkinIds(slug, index);
      if (skinIds.length === 0) continue; // Skip exercises without skin support

      if (commonSkinIds === null) {
        commonSkinIds = new Set(skinIds);
      } else {
        commonSkinIds = new Set(skinIds.filter(id => commonSkinIds!.has(id)));
      }
    }

    // Select one skin for this blueprint group
    const selectedSkin = commonSkinIds && commonSkinIds.size > 0
      ? pickSkinFromPool([...commonSkinIds], batchRecency, index)
      : null;

    // Update batch recency
    if (selectedSkin) {
      batchRecency = batchRecency.filter(id => id !== selectedSkin.id);
      batchRecency.push(selectedSkin.id);
    }

    // Assign skin to all exercises in this group
    for (const { index: i, slug } of group) {
      // Check if exercise has skin support (blueprint-specific or global)
      const hasSkinSupport = getCandidateSkinIds(slug, index).length > 0;
      result[i] = hasSkinSupport ? selectedSkin : null;
      assigned.add(i);
    }
  }

  // Process standalone exercises (not in any blueprint)
  for (let i = 0; i < exerciseSlugs.length; i++) {
    if (assigned.has(i)) continue;

    const slug = exerciseSlugs[i];
    // Get all candidate skins (blueprint-specific + global)
    const skinIds = getCandidateSkinIds(slug, index);

    if (skinIds.length > 0) {
      const selectedSkin = pickSkinFromPool(skinIds, batchRecency, index);
      result[i] = selectedSkin;

      // Update batch recency
      if (selectedSkin) {
        batchRecency = batchRecency.filter(id => id !== selectedSkin.id);
        batchRecency.push(selectedSkin.id);
      }
    }
  }

  return result;
}

/**
 * Get the RECENCY_WINDOW value (for testing)
 */
export function getRecencyWindow(): number {
  return RECENCY_WINDOW;
}
