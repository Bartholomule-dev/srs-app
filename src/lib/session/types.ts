import type { Exercise } from '@/lib/types';
import type { CardState } from '@/lib/srs';
import type { SubconceptTeaching } from '@/lib/curriculum/types';

/**
 * A card in the practice session queue, combining exercise content with SRS state.
 * This is the legacy type - prefer SessionCardType for new code.
 */
export interface SessionCard {
  /** Full exercise data (prompt, answer, hints, etc.) */
  exercise: Exercise;
  /** SRS state (easeFactor, interval, repetitions, etc.) */
  state: CardState;
  /** True if user has never seen this exercise */
  isNew: boolean;
}

/**
 * Teaching card - shows explanation and example for first encounter
 */
export interface TeachingSessionCard {
  type: 'teaching';
  /** The subconcept being taught */
  subconcept: string;
  /** Teaching content (explanation + example slug) */
  teaching: SubconceptTeaching;
  /** The example exercise to display (read-only) */
  exampleExercise: Exercise;
}

/**
 * Practice card - follows a teaching card for new subconcepts
 */
export interface PracticeSessionCard {
  type: 'practice';
  /** The exercise to practice */
  exercise: Exercise;
  /** Always true for practice cards (first real attempt) */
  isNew: boolean;
}

/**
 * Review card - standard SRS review of previously learned content
 */
export interface ReviewSessionCard {
  type: 'review';
  /** The exercise to review */
  exercise: Exercise;
}

/**
 * Discriminated union of all session card types
 */
export type SessionCardType =
  | TeachingSessionCard
  | PracticeSessionCard
  | ReviewSessionCard;

/**
 * Statistics tracked during a practice session.
 */
export interface SessionStats {
  /** Total cards in session (set at start) */
  total: number;
  /** Cards answered so far */
  completed: number;
  /** Cards answered correctly (quality >= 3) */
  correct: number;
  /** Cards answered incorrectly (quality < 3) */
  incorrect: number;
  /** When session started */
  startTime: Date;
  /** When session ended (undefined while in progress) */
  endTime?: Date;
}
