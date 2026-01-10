// src/lib/curriculum/progression.ts
import type { Concept, ConceptSlug } from './types';

/**
 * Get unlocked concepts based on completed subconcepts.
 *
 * Soft gating rules:
 * - A concept is always unlocked if it has no prerequisites
 * - A concept is unlocked if ALL its prereq concepts have at least one subconcept completed
 *
 * This allows parallel progression through concepts that share prerequisites.
 */
export function getUnlockedConcepts(
  completedSubconcepts: Set<string>,
  curriculum: Concept[]
): ConceptSlug[] {
  // Build map of concept slug -> its subconcepts
  const conceptSubconcepts = new Map<string, string[]>();
  for (const concept of curriculum) {
    conceptSubconcepts.set(concept.slug, concept.subconcepts);
  }

  // Check if a concept has at least one completed subconcept
  const hasProgress = (conceptSlug: string): boolean => {
    const subconcepts = conceptSubconcepts.get(conceptSlug) ?? [];
    return subconcepts.some((s) => completedSubconcepts.has(s));
  };

  const unlocked: ConceptSlug[] = [];

  for (const concept of curriculum) {
    // No prereqs = always unlocked
    if (concept.prereqs.length === 0) {
      unlocked.push(concept.slug);
      continue;
    }

    // Check if ALL prereqs have progress
    const allPrereqsHaveProgress = concept.prereqs.every((prereq) =>
      hasProgress(prereq)
    );
    if (allPrereqsHaveProgress) {
      unlocked.push(concept.slug);
    }
  }

  return unlocked;
}

/**
 * Get next subconcepts to learn, respecting soft gating.
 *
 * Selection strategy:
 * 1. Get all unlocked concepts
 * 2. Prioritize concepts where user has started but not finished (in-progress)
 * 3. Then add from newly unlocked concepts
 * 4. Exclude completed and in-progress subconcepts
 * 5. Respect the limit
 */
export function getNextSubconcepts(
  completedSubconcepts: Set<string>,
  inProgressSubconcepts: Set<string>,
  curriculum: Concept[],
  limit: number
): string[] {
  if (limit <= 0) return [];

  const unlockedConceptSlugs = new Set(
    getUnlockedConcepts(completedSubconcepts, curriculum)
  );

  // Build concept priority: concepts with in-progress work come first
  const conceptsWithProgress: Concept[] = [];
  const newlyUnlockedConcepts: Concept[] = [];

  for (const concept of curriculum) {
    if (!unlockedConceptSlugs.has(concept.slug)) continue;

    const hasInProgress = concept.subconcepts.some((s) =>
      inProgressSubconcepts.has(s)
    );
    const hasCompleted = concept.subconcepts.some((s) =>
      completedSubconcepts.has(s)
    );

    if (hasInProgress || hasCompleted) {
      conceptsWithProgress.push(concept);
    } else {
      newlyUnlockedConcepts.push(concept);
    }
  }

  const orderedConcepts = [...conceptsWithProgress, ...newlyUnlockedConcepts];

  const result: string[] = [];

  for (const concept of orderedConcepts) {
    if (result.length >= limit) break;

    for (const subconcept of concept.subconcepts) {
      if (result.length >= limit) break;

      if (
        !completedSubconcepts.has(subconcept) &&
        !inProgressSubconcepts.has(subconcept)
      ) {
        result.push(subconcept);
      }
    }
  }

  return result;
}
