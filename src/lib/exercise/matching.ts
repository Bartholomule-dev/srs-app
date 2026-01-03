// src/lib/exercise/matching.ts

import type { AnswerResult } from './types';

/**
 * Normalizes Python code for comparison:
 * - Converts CRLF to LF
 * - Converts tabs to 4 spaces
 * - Removes trailing whitespace per line
 * - Collapses 3+ consecutive newlines to 2 (single blank line)
 * - Trims leading/trailing whitespace from entire string
 */
export function normalizePython(code: string): string {
  if (!code) return '';

  return code
    .replace(/\r\n/g, '\n')           // CRLF → LF
    .replace(/\t/g, '    ')           // Tabs → 4 spaces
    .replace(/ +$/gm, '')             // Remove trailing spaces per line
    .replace(/\n{3,}/g, '\n\n')       // Collapse 3+ newlines to 2
    .trim();                          // Trim leading/trailing whitespace
}

/**
 * Checks if user's answer matches the expected answer.
 * Currently uses whitespace-normalized string comparison.
 *
 * Future: Add AST-based matching for semantic equivalence.
 */
export function checkAnswer(userAnswer: string, expectedAnswer: string): AnswerResult {
  const normalizedUser = normalizePython(userAnswer);
  const normalizedExpected = normalizePython(expectedAnswer);

  const isCorrect = normalizedUser === normalizedExpected;

  return {
    isCorrect,
    normalizedUserAnswer: normalizedUser,
    normalizedExpectedAnswer: normalizedExpected,
    usedAstMatch: false, // Future: set true when AST matching is used
  };
}
