/**
 * Blueprint grouping and beat sorting utilities.
 *
 * Groups exercises by their blueprint membership and sorts them
 * according to beat order within each blueprint.
 */
import type { PathIndex } from './types';

/**
 * A group of exercises belonging to the same blueprint (or standalone)
 */
export interface BlueprintGroup {
  /** Blueprint ID or null for standalone exercises */
  blueprintId: string | null;
  /** Exercises in this group */
  exercises: string[];
}

/**
 * Group exercises by their blueprint membership.
 *
 * Exercises from the same blueprint are grouped together.
 * Standalone exercises (no blueprint) form their own group with null blueprintId.
 * If an exercise belongs to multiple blueprints, uses the first one.
 *
 * @param exerciseSlugs - Array of exercise slugs to group
 * @param index - PathIndex for looking up blueprint membership
 * @returns Array of BlueprintGroup objects
 */
export function groupByBlueprint(
  exerciseSlugs: string[],
  index: PathIndex
): BlueprintGroup[] {
  const blueprintMap = new Map<string | null, string[]>();

  for (const slug of exerciseSlugs) {
    const refs = index.exerciseToBlueprints.get(slug);
    // Use first blueprint if exercise belongs to multiple, or null for standalone
    const bpId = refs && refs.length > 0 ? refs[0].blueprintId : null;

    const existing = blueprintMap.get(bpId) ?? [];
    existing.push(slug);
    blueprintMap.set(bpId, existing);
  }

  return Array.from(blueprintMap.entries()).map(([blueprintId, exercises]) => ({
    blueprintId,
    exercises,
  }));
}

/**
 * Sort exercises by their beat order within a blueprint.
 *
 * Exercises not in the blueprint are placed at the end, maintaining
 * their relative order among themselves.
 *
 * @param exerciseSlugs - Array of exercise slugs to sort
 * @param blueprintId - Blueprint ID to sort by (null returns unchanged)
 * @param index - PathIndex for looking up beat order
 * @returns New sorted array (does not mutate original)
 */
export function sortByBeat(
  exerciseSlugs: string[],
  blueprintId: string | null,
  index: PathIndex
): string[] {
  // No sorting needed for standalone group
  if (!blueprintId) {
    return exerciseSlugs;
  }

  const bp = index.blueprints.get(blueprintId);
  if (!bp) {
    // Unknown blueprint, return unchanged
    return exerciseSlugs;
  }

  // Create beat order map from blueprint definition
  const beatOrder = new Map<string, number>();
  for (const beat of bp.beats) {
    beatOrder.set(beat.exercise, beat.beat);
  }

  // Sort by beat order, using Infinity for exercises not in blueprint
  return [...exerciseSlugs].sort((a, b) => {
    const beatA = beatOrder.get(a) ?? Infinity;
    const beatB = beatOrder.get(b) ?? Infinity;
    return beatA - beatB;
  });
}
