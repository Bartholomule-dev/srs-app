// src/lib/paths/role-selection.ts
// Role-based exercise selection for blueprint beats

import type { ExercisePattern } from '@/lib/curriculum/types';
import {
  type ExerciseRole,
  type BeatInfo,
  type ExerciseInfo,
  inferRoleFromExercise,
  scoreExerciseForBeat,
} from './roles';

/**
 * Related roles that can substitute for each other in beat matching.
 * When filtering, if no exact match is found, related roles are considered.
 */
const RELATED_ROLES: Record<ExerciseRole, ExerciseRole[]> = {
  create: ['update'], // Creating and updating are related
  update: ['create'], // Updating often follows creation
  query: ['guard'], // Queries can be used for guarding
  transform: ['query'], // Transforms often include queries
  display: ['query'], // Displaying often requires querying
  persist: ['create'], // Persisting creates files
  guard: ['query', 'recover'], // Guards check conditions and handle failures
  recover: ['guard'], // Recovery is a form of guarding
};

/**
 * Beat with optional accepted roles constraint
 */
export interface BeatWithRoles extends BeatInfo {
  /** Optional list of roles this beat accepts. If undefined/empty, any role is accepted. */
  acceptedRoles?: string[];
}

/**
 * Exercise candidate for selection
 */
export interface ExerciseCandidate extends ExerciseInfo {
  slug: string;
  pattern?: ExercisePattern;
}

/**
 * Build an expanded set of acceptable roles including related roles.
 * Related roles are used as fallbacks when no exact matches exist.
 */
function expandWithRelatedRoles(acceptedRoles: string[]): Set<string> {
  const expanded = new Set<string>(acceptedRoles);

  for (const role of acceptedRoles) {
    const related = RELATED_ROLES[role as ExerciseRole];
    if (related) {
      for (const r of related) {
        expanded.add(r);
      }
    }
  }

  return expanded;
}

/**
 * Filter exercises to those matching any of the beat's accepted roles.
 *
 * If the beat has no acceptedRoles (undefined or empty array),
 * all exercises are returned (no filtering).
 *
 * Algorithm:
 * 1. First try to find exercises with exact role matches
 * 2. If none found, expand to include related roles
 * 3. Return matching exercises
 *
 * @param exercises - Array of candidate exercises
 * @param beat - Beat with optional acceptedRoles constraint
 * @returns Filtered array of exercises matching accepted roles
 */
export function filterExercisesByRoles(
  exercises: ExerciseCandidate[],
  beat: BeatWithRoles
): ExerciseCandidate[] {
  // No role constraint - return all
  if (!beat.acceptedRoles || beat.acceptedRoles.length === 0) {
    return exercises;
  }

  const acceptedSet = new Set(beat.acceptedRoles);

  // First try exact matches only
  const exactMatches = exercises.filter((exercise) => {
    const role = inferRoleFromExercise(exercise);
    return role !== undefined && acceptedSet.has(role);
  });

  // If we have exact matches, return them
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // No exact matches - try with related roles
  const expandedSet = expandWithRelatedRoles(beat.acceptedRoles);

  return exercises.filter((exercise) => {
    const role = inferRoleFromExercise(exercise);
    return role !== undefined && expandedSet.has(role);
  });
}

/**
 * Rank exercises by how well they match the beat's role requirements.
 *
 * Uses scoreExerciseForBeat() to calculate match quality.
 * Higher scores rank first. Stable sort preserves relative order
 * for exercises with equal scores.
 *
 * @param exercises - Array of candidate exercises
 * @param beat - Beat to match against
 * @returns New array sorted by role match score (descending)
 */
export function rankExercisesByRoleMatch(
  exercises: ExerciseCandidate[],
  beat: BeatWithRoles
): ExerciseCandidate[] {
  // Calculate scores for all exercises
  const scored = exercises.map((exercise, originalIndex) => ({
    exercise,
    score: scoreExerciseForBeat(exercise, beat),
    originalIndex, // For stable sorting
  }));

  // Sort by score descending, then by original index for stability
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.originalIndex - b.originalIndex;
  });

  return scored.map((s) => s.exercise);
}

/**
 * Select the best exercise for a beat based on role compatibility.
 *
 * Algorithm:
 * 1. If beat has acceptedRoles, filter to matching exercises
 * 2. Rank remaining exercises by role match score
 * 3. Return the highest-scoring exercise, or null if none available
 *
 * When beat has no acceptedRoles, all exercises are candidates
 * and ranking is based on beat title keyword matching.
 *
 * @param exercises - Array of candidate exercises
 * @param beat - Beat to select for
 * @returns Best matching exercise, or null if none available
 */
export function selectExerciseForBeat(
  exercises: ExerciseCandidate[],
  beat: BeatWithRoles
): ExerciseCandidate | null {
  if (exercises.length === 0) {
    return null;
  }

  // Step 1: Filter by accepted roles (if specified)
  const filtered = filterExercisesByRoles(exercises, beat);

  if (filtered.length === 0) {
    return null;
  }

  // Step 2: Rank by role match score
  const ranked = rankExercisesByRoleMatch(filtered, beat);

  // Step 3: Return best match
  return ranked[0] ?? null;
}

/**
 * Select multiple exercises for a beat, respecting role constraints.
 *
 * Useful for selecting main exercise + side-quests for a beat.
 * Returns exercises in order of role match quality.
 *
 * @param exercises - Array of candidate exercises
 * @param beat - Beat to select for
 * @param count - Maximum number of exercises to return
 * @returns Array of best matching exercises (up to count)
 */
export function selectExercisesForBeat(
  exercises: ExerciseCandidate[],
  beat: BeatWithRoles,
  count: number
): ExerciseCandidate[] {
  if (exercises.length === 0 || count <= 0) {
    return [];
  }

  const filtered = filterExercisesByRoles(exercises, beat);
  const ranked = rankExercisesByRoleMatch(filtered, beat);

  return ranked.slice(0, count);
}
