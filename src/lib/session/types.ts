import type { Exercise } from '@/lib/types';
import type { SubconceptTeaching } from '@/lib/curriculum/types';

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

// Type guards for session card types

/**
 * Check if a card is a teaching card
 */
export function isTeachingCard(card: SessionCardType): card is TeachingSessionCard {
  return card.type === 'teaching';
}

/**
 * Check if a card is a practice card
 */
export function isPracticeCard(card: SessionCardType): card is PracticeSessionCard {
  return card.type === 'practice';
}

/**
 * Check if a card is a review card
 */
export function isReviewCard(card: SessionCardType): card is ReviewSessionCard {
  return card.type === 'review';
}

/**
 * Check if a card has an exercise (practice or review)
 */
export function hasExercise(
  card: SessionCardType
): card is PracticeSessionCard | ReviewSessionCard {
  return card.type === 'practice' || card.type === 'review';
}

/**
 * Get a unique key for any session card type
 * Used for React key prop
 */
export function getCardKey(card: SessionCardType): string {
  if (card.type === 'teaching') {
    return `teaching-${card.subconcept}`;
  }
  return card.exercise.id;
}

/**
 * Get exercise from a card (throws if teaching card)
 * Use hasExercise() type guard before calling
 */
export function getCardExercise(card: PracticeSessionCard | ReviewSessionCard): Exercise {
  return card.exercise;
}
