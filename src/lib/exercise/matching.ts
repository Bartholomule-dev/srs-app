// src/lib/exercise/matching.ts

import type { AnswerResult } from './types';

/**
 * Normalizes Python code for comparison:
 * - Converts CRLF to LF
 * - Converts tabs to 4 spaces
 * - Removes trailing whitespace per line
 * - Collapses 3+ consecutive newlines to 2 (single blank line)
 * - Normalizes comma spacing to single space after comma
 * - Normalizes colon spacing (removes space before, ensures space after)
 * - Trims leading/trailing whitespace from entire string
 *
 * Note: These regex-based normalizations will also affect content inside strings.
 * For exercises where this matters, use accepted_solutions to provide alternatives.
 */
export function normalizePython(code: string): string {
  if (!code) return '';

  return code
    .replace(/\r\n/g, '\n')           // CRLF → LF
    .replace(/\t/g, '    ')           // Tabs → 4 spaces
    .replace(/ +$/gm, '')             // Remove trailing spaces per line
    .replace(/\n{3,}/g, '\n\n')       // Collapse 3+ newlines to 2
    .replace(/, */g, ', ')            // Comma spacing: ensure single space after
    .replace(/ +:/g, ':')             // Pre-colon: remove spaces before colon
    .replace(/:(?![\n$]) */g, ': ')   // Post-colon: ensure single space after (but not at EOL)
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
    matchedAlternative: null,
  };
}

/**
 * Checks if user's answer matches expected or any accepted alternative.
 * Returns which alternative matched (if any) for analytics.
 */
export function checkAnswerWithAlternatives(
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[]
): AnswerResult {
  const normalizedUser = normalizePython(userAnswer);
  const normalizedExpected = normalizePython(expectedAnswer);

  // Check primary expected answer first
  if (normalizedUser === normalizedExpected) {
    return {
      isCorrect: true,
      normalizedUserAnswer: normalizedUser,
      normalizedExpectedAnswer: normalizedExpected,
      usedAstMatch: false,
      matchedAlternative: null,
    };
  }

  // Check each accepted alternative
  for (const alt of acceptedSolutions) {
    const normalizedAlt = normalizePython(alt);
    if (normalizedUser === normalizedAlt) {
      return {
        isCorrect: true,
        normalizedUserAnswer: normalizedUser,
        normalizedExpectedAnswer: normalizedExpected,
        usedAstMatch: false,
        matchedAlternative: alt,
      };
    }
  }

  // No match found
  return {
    isCorrect: false,
    normalizedUserAnswer: normalizedUser,
    normalizedExpectedAnswer: normalizedExpected,
    usedAstMatch: false,
    matchedAlternative: null,
  };
}

/**
 * Check if a fill-in-the-blank answer is correct
 * @param userAnswer - User's input for the blank
 * @param expectedAnswer - Expected answer
 * @param acceptedAlternatives - Optional alternative correct answers
 */
export function checkFillInAnswer(
  userAnswer: string,
  expectedAnswer: string,
  acceptedAlternatives: string[] = []
): boolean {
  const normalized = userAnswer.trim();
  const expected = expectedAnswer.trim();

  // Check against primary answer
  if (normalized === expected) {
    return true;
  }

  // Check against alternatives
  return acceptedAlternatives.some(alt => normalized === alt.trim());
}

/**
 * Check if user's predicted output matches expected output.
 * Uses normalized matching: trim whitespace, remove trailing newlines, case-sensitive.
 */
export function checkPredictAnswer(
  userAnswer: string,
  expectedAnswer: string,
  acceptedAlternatives: string[] = []
): boolean {
  const normalize = (s: string): string => {
    return s.trim().replace(/\n+$/, '');
  };

  const normalizedUser = normalize(userAnswer);
  const normalizedExpected = normalize(expectedAnswer);

  if (normalizedUser === normalizedExpected) {
    return true;
  }

  return acceptedAlternatives.some(
    (alt) => normalize(alt) === normalizedUser
  );
}
