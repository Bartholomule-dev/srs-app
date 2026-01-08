// src/lib/exercise/types.ts

import type { ConstructType } from '@/lib/generators/types';

/**
 * Result of checking a user's answer against the expected answer.
 */
export interface AnswerResult {
  /** Whether the answer was correct (exact or AST match) */
  isCorrect: boolean;
  /** The user's answer after normalization */
  normalizedUserAnswer: string;
  /** The expected answer after normalization */
  normalizedExpectedAnswer: string;
  /** True if AST matching was used (format differs but semantically equivalent) */
  usedAstMatch: boolean;
  /** The accepted_solution that matched, or null if expected_answer matched */
  matchedAlternative: string | null;
}

/**
 * Inputs for inferring the SM-2 quality score.
 */
export interface QualityInputs {
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Whether the user used a hint */
  hintUsed: boolean;
  /** Time from first keystroke to submission (milliseconds) */
  responseTimeMs: number;
  /** Whether AST matching was used for correctness */
  usedAstMatch: boolean;
  /**
   * Current number of successful reviews for this subconcept.
   * Used to prevent one-shot "Easy" ratings on first exposure.
   * If reps < 2, quality is capped at 4 (Good) even if answer is fast.
   */
  currentReps?: number;
}

/** Grading method used for correctness check. */
export type GradingMethod = 'string' | 'execution' | 'execution-fallback';

/**
 * Result of the full two-pass grading process.
 */
export interface GradingResult {
  /** Whether the answer is correct (Pass 1) */
  isCorrect: boolean;
  /** Whether user used the target construct (Pass 2, null if no target) */
  usedTargetConstruct: boolean | null;
  /** Coaching feedback if correct but didn't use target construct */
  coachingFeedback: string | null;
  /** Method used for correctness grading */
  gradingMethod: GradingMethod;
  /** Normalized user answer for display */
  normalizedUserAnswer: string;
  /** Normalized expected answer for display */
  normalizedExpectedAnswer: string;
  /** Which alternative matched (if any) */
  matchedAlternative: string | null;
}

/**
 * Result of checking whether code contains a specific construct.
 * Used by two-pass grading to verify users employ target constructs.
 */
export interface ConstructCheckResult {
  /** Whether the construct was detected in the code */
  detected: boolean;
  /** The construct type that was checked (or first detected for checkAnyConstruct) */
  constructType: ConstructType | null;
}
