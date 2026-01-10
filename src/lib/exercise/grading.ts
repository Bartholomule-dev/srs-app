// src/lib/exercise/grading.ts
// Two-pass grading orchestrator for dynamic exercises.
// Pass 1: Check correctness via strategy router (exact/token/ast/execution)
// Pass 2: If correct AND targetConstruct defined, check if construct was used

import type { Exercise } from '@/lib/types';
import type { GradingResult, GradingMethod, GradingStrategy } from './types';
import type { ConstructType } from '@/lib/generators/types';
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import {
  checkAnswerWithAlternatives,
  checkFillInAnswer,
  checkPredictAnswer,
} from './matching';
import { checkConstruct } from './construct-check';
import { gradeWithStrategy } from './strategy-router';
import { createTelemetryEntry, logGradingTelemetry } from './telemetry';
import { getDefaultStrategy } from './strategy-defaults';

// Note: verifyPredictAnswer and verifyWriteAnswer are now called by strategy-router.ts

const DEFAULT_COACHING_FEEDBACK =
  'Great job! Consider trying the suggested approach next time.';

/**
 * Two-pass grading:
 * Pass 1: Check correctness (string matching based on exercise type)
 * Pass 2: If correct AND targetConstruct defined, check if construct was used
 */
export function gradeAnswer(userAnswer: string, exercise: Exercise): GradingResult {
  // Pass 1: Correctness check based on exercise type
  const correctnessResult = checkCorrectness(userAnswer, exercise);

  // If incorrect, skip Pass 2 and return early
  if (!correctnessResult.isCorrect) {
    return {
      isCorrect: false,
      usedTargetConstruct: null,
      coachingFeedback: null,
      gradingMethod: 'string',
      normalizedUserAnswer: correctnessResult.normalizedUserAnswer,
      normalizedExpectedAnswer: correctnessResult.normalizedExpectedAnswer,
      matchedAlternative: null,
    };
  }

  // Pass 2: If correct AND exercise.targetConstruct exists, check construct usage
  const targetConstruct = exercise.targetConstruct;

  if (!targetConstruct) {
    // No target construct to check
    return {
      isCorrect: true,
      usedTargetConstruct: null,
      coachingFeedback: null,
      gradingMethod: 'string',
      normalizedUserAnswer: correctnessResult.normalizedUserAnswer,
      normalizedExpectedAnswer: correctnessResult.normalizedExpectedAnswer,
      matchedAlternative: correctnessResult.matchedAlternative,
    };
  }

  // Check if user's answer contains the target construct
  const constructResult = checkConstruct(
    userAnswer,
    targetConstruct.type as ConstructType
  );

  if (constructResult.detected) {
    // Used target construct - no coaching needed
    return {
      isCorrect: true,
      usedTargetConstruct: true,
      coachingFeedback: null,
      gradingMethod: 'string',
      normalizedUserAnswer: correctnessResult.normalizedUserAnswer,
      normalizedExpectedAnswer: correctnessResult.normalizedExpectedAnswer,
      matchedAlternative: correctnessResult.matchedAlternative,
    };
  }

  // Correct but didn't use target construct - add coaching feedback
  const coachingFeedback = targetConstruct.feedback ?? DEFAULT_COACHING_FEEDBACK;

  return {
    isCorrect: true,
    usedTargetConstruct: false,
    coachingFeedback,
    gradingMethod: 'string',
    normalizedUserAnswer: correctnessResult.normalizedUserAnswer,
    normalizedExpectedAnswer: correctnessResult.normalizedExpectedAnswer,
    matchedAlternative: correctnessResult.matchedAlternative,
  };
}

/**
 * Check if coaching feedback should be shown to the user.
 */
export function shouldShowCoaching(result: GradingResult): boolean {
  return result.isCorrect && result.usedTargetConstruct === false;
}

/**
 * Internal helper to check correctness based on exercise type.
 */
interface CorrectnessResult {
  isCorrect: boolean;
  normalizedUserAnswer: string;
  normalizedExpectedAnswer: string;
  matchedAlternative: string | null;
}

function checkCorrectness(userAnswer: string, exercise: Exercise): CorrectnessResult {
  const { exerciseType, expectedAnswer, acceptedSolutions } = exercise;

  switch (exerciseType) {
    case 'write': {
      const result = checkAnswerWithAlternatives(
        userAnswer,
        expectedAnswer,
        acceptedSolutions
      );
      return {
        isCorrect: result.isCorrect,
        normalizedUserAnswer: result.normalizedUserAnswer,
        normalizedExpectedAnswer: result.normalizedExpectedAnswer,
        matchedAlternative: result.matchedAlternative,
      };
    }

    case 'fill-in': {
      const isCorrect = checkFillInAnswer(
        userAnswer,
        expectedAnswer,
        acceptedSolutions
      );
      return {
        isCorrect,
        normalizedUserAnswer: userAnswer.trim(),
        normalizedExpectedAnswer: expectedAnswer.trim(),
        matchedAlternative: null, // fill-in doesn't track which alt matched
      };
    }

    case 'predict': {
      const isCorrect = checkPredictAnswer(
        userAnswer,
        expectedAnswer,
        acceptedSolutions
      );
      // Normalize for display
      const normalize = (s: string): string => s.trim().replace(/\n+$/, '');
      return {
        isCorrect,
        normalizedUserAnswer: normalize(userAnswer),
        normalizedExpectedAnswer: normalize(expectedAnswer),
        matchedAlternative: null, // predict doesn't track which alt matched
      };
    }

    default: {
      // Fallback to write-style matching for unknown types
      const result = checkAnswerWithAlternatives(
        userAnswer,
        expectedAnswer,
        acceptedSolutions
      );
      return {
        isCorrect: result.isCorrect,
        normalizedUserAnswer: result.normalizedUserAnswer,
        normalizedExpectedAnswer: result.normalizedExpectedAnswer,
        matchedAlternative: result.matchedAlternative,
      };
    }
  }
}

/**
 * Grade a user's answer using the strategy router.
 *
 * Routes to the appropriate grading strategy based on exercise config:
 * - exact: String matching (default for fill-in)
 * - token: Pyodide tokenization (whitespace/comment tolerance)
 * - ast: AST normalization (semantic equivalence)
 * - execution: Output verification (default for predict)
 *
 * Falls back gracefully if infrastructure (Pyodide) is unavailable.
 *
 * @param userAnswer - User's submitted answer
 * @param exercise - Exercise being graded
 * @param pyodide - Optional Pyodide instance for token/ast/execution grading
 * @returns Full grading result with construct check
 */
export async function gradeAnswerAsync(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<GradingResult> {
  // Get strategy config (uses exercise.gradingStrategy or infers default)
  const config = getDefaultStrategy(exercise);
  const strategy = config.primary;

  // Run grading through strategy router
  const strategyResult = await gradeWithStrategy(userAnswer, exercise, pyodide);

  // Map strategy result to GradingMethod for backward compatibility
  const gradingMethod = mapToGradingMethod(strategy, strategyResult.fallbackUsed);

  // Build full result with construct check
  const result = buildGradingResult(
    strategyResult.isCorrect,
    userAnswer,
    exercise,
    gradingMethod,
    strategyResult.matchedAlternative
  );

  // Log telemetry
  const telemetry = createTelemetryEntry({
    exerciseSlug: exercise.slug,
    strategy,
    wasCorrect: result.isCorrect,
    fallbackUsed: strategyResult.fallbackUsed,
    fallbackReason: strategyResult.fallbackReason,
    matchedAlternative: result.matchedAlternative,
    userAnswer,
  });
  logGradingTelemetry(telemetry);

  return result;
}

/**
 * Map grading strategy to GradingMethod type.
 */
function mapToGradingMethod(strategy: GradingStrategy, fallbackUsed: boolean): GradingMethod {
  if (fallbackUsed) {
    switch (strategy) {
      case 'token': return 'token-fallback';
      case 'ast': return 'ast-fallback';
      case 'execution': return 'execution-fallback';
      default: return 'string';
    }
  }
  switch (strategy) {
    case 'exact': return 'string';
    case 'token': return 'token';
    case 'ast': return 'ast';
    case 'execution': return 'execution';
    default: return 'string';
  }
}

/**
 * Helper to build grading result with construct check.
 */
function buildGradingResult(
  isCorrect: boolean,
  userAnswer: string,
  exercise: Exercise,
  gradingMethod: GradingResult['gradingMethod'],
  matchedAlternative: string | null = null
): GradingResult {
  const normalizedUser = userAnswer.trim();
  const normalizedExpected = exercise.expectedAnswer.trim();

  // Run construct check if correct and target defined
  let usedTargetConstruct: boolean | null = null;
  let coachingFeedback: string | null = null;

  if (isCorrect && exercise.targetConstruct) {
    const constructResult = checkConstruct(
      userAnswer,
      exercise.targetConstruct.type as ConstructType
    );
    usedTargetConstruct = constructResult.detected;

    if (!usedTargetConstruct) {
      coachingFeedback =
        exercise.targetConstruct.feedback ?? DEFAULT_COACHING_FEEDBACK;
    }
  }

  return {
    isCorrect,
    usedTargetConstruct,
    coachingFeedback,
    gradingMethod,
    normalizedUserAnswer: normalizedUser,
    normalizedExpectedAnswer: normalizedExpected,
    matchedAlternative,
  };
}
