// src/lib/session/anti-repeat.ts
// Anti-repeat pattern selection for session variety

import type { Exercise } from '@/lib/types';
import type { ExercisePattern, SubconceptProgress } from '@/lib/curriculum/types';

export interface SelectionCandidate {
  exercise: Exercise;
  progress: SubconceptProgress;
}

/**
 * Select next candidate while avoiding same pattern as last exercise.
 * Falls back to same pattern if no alternatives exist.
 *
 * @param candidates - Array of candidate exercises with their progress
 * @param lastPattern - The pattern of the previous exercise (or null if no previous)
 * @returns The selected candidate or null if no candidates
 */
export function selectWithAntiRepeat(
  candidates: SelectionCandidate[],
  lastPattern: ExercisePattern | null
): SelectionCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  // If no previous pattern, return the first candidate
  if (lastPattern === null || lastPattern === undefined) {
    return candidates[0];
  }

  // Prefer candidates with different pattern to add variety
  const differentPattern = candidates.filter(
    (c) => c.exercise.pattern !== lastPattern
  );

  if (differentPattern.length > 0) {
    return differentPattern[0];
  }

  // Fallback to same pattern if no alternatives
  return candidates[0];
}
