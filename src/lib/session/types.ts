import type { Exercise } from '@/lib/types';
import type { CardState } from '@/lib/srs';

/**
 * A card in the practice session queue, combining exercise content with SRS state.
 * This is the type useSession works with internally and exposes to components.
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
