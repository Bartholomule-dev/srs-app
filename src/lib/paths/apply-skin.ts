import type { PathIndex, SkinnedCard } from './types';

/**
 * Create a SkinnedCard by applying skin context to an exercise.
 *
 * Looks up blueprint information (beat position, title) and skin context
 * (domain-specific explanation text) for the given exercise.
 *
 * @param exerciseSlug - The exercise identifier
 * @param skinId - The skin to apply (null for no skin)
 * @param index - The PathIndex containing blueprints and skins
 * @returns A SkinnedCard with all available context
 */
export function applySkinContext(
  exerciseSlug: string,
  skinId: string | null,
  index: PathIndex
): SkinnedCard {
  // Get blueprint info for this exercise
  const bpRefs = index.exerciseToBlueprints.get(exerciseSlug);
  const bpRef = bpRefs && bpRefs.length > 0 ? bpRefs[0] : null;

  // Get skin and its context for this exercise
  const skin = skinId ? index.skins.get(skinId) : null;
  const context = skin?.contexts[exerciseSlug] ?? null;

  return {
    exerciseSlug,
    skinId,
    blueprintId: bpRef?.blueprintId ?? null,
    beat: bpRef?.beat ?? null,
    totalBeats: bpRef?.totalBeats ?? null,
    beatTitle: bpRef?.beatTitle ?? null,
    context,
  };
}

/**
 * Apply skin context to multiple exercises at once.
 *
 * @param exerciseSlugs - Array of exercise identifiers
 * @param skins - Array of skin IDs (same length as exerciseSlugs, nulls allowed)
 * @param index - The PathIndex containing blueprints and skins
 * @returns Array of SkinnedCards in the same order as input
 */
export function applySkinContextBatch(
  exerciseSlugs: string[],
  skins: (string | null)[],
  index: PathIndex
): SkinnedCard[] {
  return exerciseSlugs.map((slug, i) =>
    applySkinContext(slug, skins[i] ?? null, index)
  );
}
