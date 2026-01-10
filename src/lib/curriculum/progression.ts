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
