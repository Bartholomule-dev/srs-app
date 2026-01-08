/**
 * Visual states for subconcept nodes in the skill tree
 */
export const SUBCONCEPT_STATES = ['locked', 'available', 'in-progress', 'mastered'] as const;
export type SubconceptState = (typeof SUBCONCEPT_STATES)[number];

/**
 * Type guard for SubconceptState
 */
export function isValidSubconceptState(value: unknown): value is SubconceptState {
  return typeof value === 'string' && SUBCONCEPT_STATES.includes(value as SubconceptState);
}

/**
 * Mastery threshold - stability in days required for "mastered" state
 * FSRS stability >= 7 means the algorithm predicts retention for at least a week
 */
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
