// src/lib/srs/fsrs/adapter.ts
// Adapter layer between ts-fsrs library and our application types

import { FSRS, createEmptyCard, type Card, type Grade, State } from 'ts-fsrs';
import type { FSRSCardState, FSRSRating, FSRSReviewResult, FSRSState } from './types';
import { STATE_MAP, STATE_REVERSE_MAP, RATING_MAP } from './types';

// Single FSRS instance with default parameters
const fsrs = new FSRS({});

/**
 * Creates a new empty FSRS card in the New state.
 */
export function createEmptyFSRSCard(due: Date = new Date()): FSRSCardState {
  const card = createEmptyCard(due);
  return tsfsrsCardToState(card);
}

/**
 * Reviews a card with the given rating and returns the updated card state.
 */
export function reviewCard(
  cardState: FSRSCardState,
  rating: FSRSRating,
  now: Date = new Date()
): FSRSReviewResult {
  const card = stateToTsfsrsCard(cardState);
  const tsRating = RATING_MAP[rating] as Grade;
  const result = fsrs.next(card, now, tsRating);

  return {
    cardState: tsfsrsCardToState(result.card),
    rating,
    wasCorrect: rating !== 'Again',
  };
}

/**
 * Converts ts-fsrs Card to our FSRSCardState.
 */
function tsfsrsCardToState(card: Card): FSRSCardState {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_REVERSE_MAP[card.state as number] ?? 'New',
    lastReview: card.last_review ?? null,
  };
}

/**
 * Converts our FSRSCardState to ts-fsrs Card.
 */
function stateToTsfsrsCard(state: FSRSCardState): Card {
  return {
    due: state.due,
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    reps: state.reps,
    lapses: state.lapses,
    state: STATE_MAP[state.state] as State,
    last_review: state.lastReview ?? undefined,
    learning_steps: 0, // Default to 0 for cards reconstructed from our state
  };
}

/**
 * Extracts database-storable fields from FSRSCardState.
 * These fields will be stored in subconcept_progress table.
 */
export function cardStateToProgress(state: FSRSCardState) {
  return {
    stability: state.stability,
    difficulty: state.difficulty,
    fsrsState: state.state,
    due: state.due,
    lastReview: state.lastReview,
    reps: state.reps,
    lapses: state.lapses,
    elapsedDays: state.elapsedDays,
    scheduledDays: state.scheduledDays,
  };
}

/**
 * Reconstructs FSRSCardState from database progress fields.
 */
export function progressToCardState(progress: {
  stability: number;
  difficulty: number;
  fsrsState: FSRSState;
  due: Date;
  lastReview: Date | null;
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;
}): FSRSCardState {
  return {
    due: progress.due,
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsedDays: progress.elapsedDays,
    scheduledDays: progress.scheduledDays,
    reps: progress.reps,
    lapses: progress.lapses,
    state: progress.fsrsState,
    lastReview: progress.lastReview,
  };
}
