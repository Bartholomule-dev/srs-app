// src/lib/srs/fsrs/types.ts
// Local wrapper types to avoid leaking ts-fsrs types throughout codebase

/**
 * FSRS card state for a subconcept
 */
export interface FSRSCardState {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: FSRSState;
  lastReview: Date | null;
}

/**
 * FSRS state enum (mirrors ts-fsrs State)
 */
export type FSRSState = 'New' | 'Learning' | 'Review' | 'Relearning';

/**
 * FSRS rating enum (mirrors ts-fsrs Rating)
 */
export type FSRSRating = 'Again' | 'Hard' | 'Good' | 'Easy';

/**
 * Input for review calculation (what the UI provides)
 */
export interface ReviewInput {
  isCorrect: boolean;
  hintUsed: boolean;
  responseTimeMs: number;
  usedAstMatch?: boolean;
}

/**
 * Result of a review calculation
 */
export interface FSRSReviewResult {
  cardState: FSRSCardState;
  rating: FSRSRating;
  wasCorrect: boolean;
}

/**
 * Map our FSRSState to ts-fsrs State numeric values
 */
export const STATE_MAP: Record<FSRSState, number> = {
  New: 0,
  Learning: 1,
  Review: 2,
  Relearning: 3,
};

/**
 * Map ts-fsrs State numeric values to our FSRSState
 */
export const STATE_REVERSE_MAP: Record<number, FSRSState> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

/**
 * Map our FSRSRating to ts-fsrs Rating numeric values
 */
export const RATING_MAP: Record<FSRSRating, number> = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
};
