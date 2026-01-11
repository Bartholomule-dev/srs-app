// src/lib/srs/multi-target.ts
// Multi-subconcept credit/penalty logic for exercises with targets

/**
 * Get subconcepts to credit on success.
 * For exercises with targets: credit all targets.
 * Otherwise: credit primary subconcept.
 */
export function getTargetsToCredit(
  targets: string[] | null,
  primarySubconcept: string,
  wasCorrect: boolean
): string[] {
  if (!wasCorrect) {
    return [];
  }

  if (targets && targets.length > 0) {
    return targets;
  }

  return [primarySubconcept];
}

/**
 * Get subconcepts to penalize on failure.
 * Only penalize the primary subconcept.
 * - If primarySubconcept is in targets, use it
 * - Otherwise use first target if available
 * - Otherwise use primarySubconcept
 */
export function getTargetsToPenalize(
  targets: string[] | null,
  primarySubconcept: string,
  wasCorrect: boolean
): string[] {
  if (wasCorrect) {
    return [];
  }

  // If no targets, use primarySubconcept
  if (!targets || targets.length === 0) {
    return [primarySubconcept];
  }

  // If primarySubconcept is in targets, use it
  if (targets.includes(primarySubconcept)) {
    return [primarySubconcept];
  }

  // Otherwise use first target
  return [targets[0]];
}
