// src/lib/exercise/grading.ts
// Two-pass grading orchestrator for dynamic exercises.
// Pass 1: Check correctness (string matching based on exercise type)
// Pass 2: If correct AND targetConstruct defined, check if construct was used

import type { Exercise } from '@/lib/types';
import type { GradingResult } from './types';
import type { ConstructType } from '@/lib/generators/types';
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import {
  checkAnswerWithAlternatives,
  checkFillInAnswer,
  checkPredictAnswer,
} from './matching';
import { checkConstruct } from './construct-check';
import { verifyPredictAnswer, verifyWriteAnswer } from './execution';

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
 * Grade a user's answer with optional Pyodide execution.
 *
 * For predict exercises (or write exercises with verifyByExecution),
 * attempts execution grading first, falls back to string matching.
 *
 * @param userAnswer - User's submitted answer
 * @param exercise - Exercise being graded
 * @param pyodide - Optional Pyodide instance for execution grading
 * @returns Full grading result
 */
export async function gradeAnswerAsync(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<GradingResult> {
  // Determine if we should use execution grading
  const shouldUseExecution =
    pyodide !== null &&
    (exercise.exerciseType === 'predict' || exercise.verifyByExecution === true);

  if (shouldUseExecution && pyodide) {
    try {
      let isCorrect = false;

      if (exercise.exerciseType === 'predict' && exercise.code) {
        // For predict: execute the exercise code and compare output with user's answer
        isCorrect = await verifyPredictAnswer(
          pyodide,
          exercise.code,
          userAnswer
        );
      } else if (exercise.verifyByExecution) {
        // For write with execution: run user's code and check output
        isCorrect = await verifyWriteAnswer(
          pyodide,
          userAnswer,
          exercise.expectedAnswer
        );
      }

      if (isCorrect) {
        // Execution succeeded and matched
        return buildGradingResult(
          true,
          userAnswer,
          exercise,
          'execution'
        );
      } else {
        // Execution ran but didn't match - this is a real wrong answer
        return buildGradingResult(
          false,
          userAnswer,
          exercise,
          'execution'
        );
      }
    } catch {
      // Execution failed - fall back to string matching
      console.warn('Execution grading failed, falling back to string matching');
      const result = gradeAnswer(userAnswer, exercise);
      return {
        ...result,
        gradingMethod: 'execution-fallback',
      };
    }
  }

  // Use standard string matching
  return gradeAnswer(userAnswer, exercise);
}

/**
 * Helper to build grading result from execution result.
 */
function buildGradingResult(
  isCorrect: boolean,
  userAnswer: string,
  exercise: Exercise,
  gradingMethod: GradingResult['gradingMethod']
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
    matchedAlternative: null,
  };
}
