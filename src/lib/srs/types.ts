import type { Quality } from '@/lib/types';

/**
 * Represents the SRS state for a single card/exercise
 */
export interface CardState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReviewed: Date | null;
}

/**
 * Result of reviewing a card
 */
export interface ReviewResult {
  newState: CardState;
  wasCorrect: boolean;
  quality: Quality;
}

/**
 * SM-2 algorithm configuration
 */
export interface SRSConfig {
  minEaseFactor: number;
  maxEaseFactor: number;
  initialEaseFactor: number;
  initialInterval: number;
  graduatingInterval: number;
}

/**
 * Default SM-2 configuration
 */
export const DEFAULT_SRS_CONFIG: SRSConfig = {
  minEaseFactor: 1.3,
  maxEaseFactor: 3.0,
  initialEaseFactor: 2.5,
  initialInterval: 1,
  graduatingInterval: 6,
};

/**
 * Card with exercise data for display
 */
export interface DueCard {
  exerciseId: string;
  state: CardState;
  isNew: boolean;
}

/** Quality threshold for considering an answer "correct" (passing) per SM-2 algorithm */
export const QUALITY_PASSING_THRESHOLD = 3;
