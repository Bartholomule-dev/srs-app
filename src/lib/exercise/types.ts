// src/lib/exercise/types.ts

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
}
