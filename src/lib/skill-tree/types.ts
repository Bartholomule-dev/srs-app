import type { SubconceptProgress } from '@/lib/curriculum/types';

/**
 * Visual states for subconcept nodes in the skill tree
 */
export const SUBCONCEPT_STATES = ['locked', 'available', 'in-progress', 'proficient', 'mastered'] as const;
export type SubconceptState = (typeof SUBCONCEPT_STATES)[number];

/**
 * Type guard for SubconceptState
 */
export function isValidSubconceptState(value: unknown): value is SubconceptState {
  return typeof value === 'string' && SUBCONCEPT_STATES.includes(value as SubconceptState);
}

/**
 * Mastery thresholds for tiered progress system
 *
 * Fast-track: stability >= 21 → mastered (genuine long-term retention)
 * Standard:   stability >= 14 AND reps >= 3 → mastered (proven consistency)
 * Proficient: stability >= 10 AND reps >= 2 → proficient (on track)
 * In-progress: reps >= 1
 */
export const MASTERY_STABILITY_FAST = 21;
export const MASTERY_STABILITY_STANDARD = 14;
export const MASTERY_REPS = 3;
export const PROFICIENT_STABILITY = 10;
export const PROFICIENT_REPS = 2;

/** @deprecated Use MASTERY_STABILITY_STANDARD instead */
export const MASTERY_THRESHOLD_DAYS = 7;

/**
 * Computed skill tree data for a single subconcept
 */
export interface SkillTreeNode {
  slug: string;
  name: string;
  concept: string;
  state: SubconceptState;
  stability: number | null; // FSRS stability in days
  reps: number; // Number of successful reviews
  prereqs: string[];
}

/**
 * Computed skill tree data for a concept cluster
 */
export interface SkillTreeCluster {
  slug: string;
  name: string;
  description: string;
  tier: number; // 1-7 based on curriculum DAG
  subconcepts: SkillTreeNode[];
  masteredCount: number;
  totalCount: number;
}

/**
 * Full skill tree data structure
 */
export interface SkillTreeData {
  clusters: SkillTreeCluster[];
  totalMastered: number;
  totalSubconcepts: number;
}

/**
 * Determine the visual state of a subconcept node
 *
 * Uses tiered progress system:
 * - Fast-track: stability >= 21 → mastered (genuine long-term retention)
 * - Standard:   stability >= 14 AND reps >= 3 → mastered (proven consistency)
 * - Proficient: stability >= 10 AND reps >= 2 → proficient (on track)
 * - In-progress: has any progress
 * - Available: prerequisites met, no progress
 * - Locked: prerequisites not met
 *
 * @param slug - The subconcept slug
 * @param progressMap - Map of slug -> SubconceptProgress
 * @param prereqs - Array of prerequisite subconcept slugs
 * @returns The computed SubconceptState
 */
export function getSubconceptState(
  slug: string,
  progressMap: Map<string, SubconceptProgress>,
  prereqs: string[]
): SubconceptState {
  // Check if all prerequisites are mastered (use standard threshold for prereq check)
  const prereqsMastered = prereqs.every((prereqSlug) => {
    const prereqProgress = progressMap.get(prereqSlug);
    if (!prereqProgress) return false;
    // Prereq is mastered if it meets fast-track OR standard mastery criteria
    return (
      prereqProgress.stability >= MASTERY_STABILITY_FAST ||
      (prereqProgress.stability >= MASTERY_STABILITY_STANDARD && prereqProgress.reps >= MASTERY_REPS)
    );
  });

  if (!prereqsMastered) {
    return 'locked';
  }

  const myProgress = progressMap.get(slug);

  if (!myProgress) {
    return 'available';
  }

  // Fast-track: genuine long-term retention
  if (myProgress.stability >= MASTERY_STABILITY_FAST) {
    return 'mastered';
  }

  // Standard mastery: proven consistency over time
  if (myProgress.stability >= MASTERY_STABILITY_STANDARD && myProgress.reps >= MASTERY_REPS) {
    return 'mastered';
  }

  // Proficient: on track but not yet mastered
  if (myProgress.stability >= PROFICIENT_STABILITY && myProgress.reps >= PROFICIENT_REPS) {
    return 'proficient';
  }

  return 'in-progress';
}
