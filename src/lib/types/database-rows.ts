/**
 * Database row types for tables without generated types
 *
 * These types represent the raw database schema (snake_case) and provide
 * mappers to convert to application types (camelCase).
 *
 * Note: These types are manually maintained. If the database schema changes,
 * update these types accordingly.
 */

import type { SubconceptProgress, ExerciseAttempt, ConceptSlug } from '../curriculum/types';

/**
 * Database row type for exercise_attempts table
 */
export interface DbExerciseAttempt {
  id: string;
  user_id: string;
  exercise_slug: string;
  times_seen: number;
  times_correct: number;
  last_seen_at: string | null;
  created_at: string;
}

/**
 * Database row type for subconcept_progress table (FSRS schema)
 */
export interface DbSubconceptProgress {
  id: string;
  user_id: string;
  subconcept_slug: string;
  concept_slug: string;
  stability: number | null;
  difficulty: number | null;
  fsrs_state: number | null;
  reps: number | null;
  lapses: number | null;
  elapsed_days: number | null;
  scheduled_days: number | null;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Map database row to app type for ExerciseAttempt
 */
export function mapDbToExerciseAttempt(row: DbExerciseAttempt): ExerciseAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseSlug: row.exercise_slug,
    timesSeen: row.times_seen,
    timesCorrect: row.times_correct,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : new Date(),
  };
}

/**
 * Validate fsrs_state from database - guards against corrupted data.
 * Returns 0 (New) for invalid values.
 */
function validateFsrsState(value: number | null | undefined): 0 | 1 | 2 | 3 {
  const state = value ?? 0;
  if (state >= 0 && state <= 3 && Number.isInteger(state)) {
    return state as 0 | 1 | 2 | 3;
  }
  // Invalid state - fall back to New (0) which is safest
  // This handles corruption, NaN, decimals, negative values, etc.
  console.warn(`Invalid fsrs_state value: ${value}, defaulting to 0 (New)`);
  return 0;
}

/**
 * Map database row to app type for SubconceptProgress (FSRS schema)
 */
export function mapDbToSubconceptProgress(row: DbSubconceptProgress): SubconceptProgress {
  return {
    id: row.id,
    userId: row.user_id,
    subconceptSlug: row.subconcept_slug,
    conceptSlug: row.concept_slug as ConceptSlug,
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    fsrsState: validateFsrsState(row.fsrs_state),
    reps: row.reps ?? 0,
    lapses: row.lapses ?? 0,
    elapsedDays: row.elapsed_days ?? 0,
    scheduledDays: row.scheduled_days ?? 0,
    nextReview: new Date(row.next_review),
    lastReviewed: row.last_reviewed ? new Date(row.last_reviewed) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
