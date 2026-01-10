// src/lib/exercise/strategy-router.ts
import type { Exercise } from '@/lib/types';
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import type { GradingStrategy } from './types';
import { getDefaultStrategy } from './strategy-defaults';
import { checkAnswerWithAlternatives, checkFillInAnswer, checkPredictAnswer } from './matching';
import { compareByTokens } from './token-compare';
import { compareByAst } from './ast-compare';
import { verifyWithScript } from './verification';
import { verifyPredictAnswer, verifyWriteAnswer } from './execution';

export interface StrategyResult {
  isCorrect: boolean;
  infraAvailable: boolean;
  matchedAlternative: string | null;
  error?: string;
}

export interface GradingWithStrategyResult extends StrategyResult {
  fallbackUsed: boolean;
  fallbackReason?: string;
}

export async function gradeWithStrategy(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<GradingWithStrategyResult> {
  const config = getDefaultStrategy(exercise);

  // Try primary strategy
  const result = await executeStrategy(config.primary, userAnswer, exercise, pyodide);

  // Only fall back if infrastructure was unavailable
  if (!result.infraAvailable && config.fallback) {
    console.warn(`Strategy '${config.primary}' unavailable, falling back to '${config.fallback}'`);
    const fallbackResult = await executeStrategy(config.fallback, userAnswer, exercise, pyodide);
    return {
      ...fallbackResult,
      fallbackUsed: true,
      fallbackReason: 'infra_unavailable',
    };
  }

  return { ...result, fallbackUsed: false };
}

async function executeStrategy(
  strategy: GradingStrategy,
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<StrategyResult> {
  switch (strategy) {
    case 'exact':
      return executeExactStrategy(userAnswer, exercise);

    case 'token':
      if (!pyodide) {
        return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
      }
      return executeTokenStrategy(pyodide, userAnswer, exercise);

    case 'execution':
      return executeExecutionStrategy(userAnswer, exercise, pyodide);

    case 'ast':
      if (!pyodide) {
        return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
      }
      return executeAstStrategy(pyodide, userAnswer, exercise);

    default:
      return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
  }
}

function executeExactStrategy(userAnswer: string, exercise: Exercise): StrategyResult {
  const { exerciseType, expectedAnswer, acceptedSolutions } = exercise;

  let isCorrect = false;
  let matchedAlternative: string | null = null;

  switch (exerciseType) {
    case 'fill-in':
      isCorrect = checkFillInAnswer(userAnswer, expectedAnswer, acceptedSolutions);
      break;

    case 'predict':
      isCorrect = checkPredictAnswer(userAnswer, expectedAnswer, acceptedSolutions);
      break;

    case 'write':
    default: {
      const result = checkAnswerWithAlternatives(userAnswer, expectedAnswer, acceptedSolutions);
      isCorrect = result.isCorrect;
      matchedAlternative = result.matchedAlternative;
    }
  }

  return { isCorrect, infraAvailable: true, matchedAlternative };
}

async function executeTokenStrategy(
  pyodide: PyodideInterface,
  userAnswer: string,
  exercise: Exercise
): Promise<StrategyResult> {
  try {
    const result = await compareByTokens(
      pyodide,
      userAnswer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions
    );
    return {
      isCorrect: result.match,
      infraAvailable: true,
      matchedAlternative: result.matchedAlternative,
    };
  } catch (error) {
    return {
      isCorrect: false,
      infraAvailable: false,
      matchedAlternative: null,
      error: error instanceof Error ? error.message : 'Token comparison failed',
    };
  }
}

async function executeExecutionStrategy(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<StrategyResult> {
  // Verification scripts run in worker (no Pyodide needed)
  if (exercise.verificationScript) {
    try {
      const result = await verifyWithScript(userAnswer, exercise.verificationScript);
      return {
        isCorrect: result.passed,
        infraAvailable: result.infraAvailable,
        matchedAlternative: null,
        error: result.error,
      };
    } catch (error) {
      return {
        isCorrect: false,
        infraAvailable: false,
        matchedAlternative: null,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  // Output-based execution requires Pyodide
  if (!pyodide) {
    return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
  }

  try {
    let isCorrect = false;

    if (exercise.exerciseType === 'predict' && exercise.code) {
      isCorrect = await verifyPredictAnswer(pyodide, exercise.code, userAnswer);

      // If execution comparison failed but we have accepted_solutions,
      // check if user's answer matches any alternative (handles set/dict order variations)
      if (!isCorrect && exercise.acceptedSolutions && exercise.acceptedSolutions.length > 0) {
        isCorrect = checkPredictAnswer(userAnswer, exercise.expectedAnswer, exercise.acceptedSolutions);
        if (isCorrect) {
          // Find which alternative matched for tracking
          const matchedAlt = findMatchedAlternative(userAnswer, exercise.acceptedSolutions);
          return { isCorrect: true, infraAvailable: true, matchedAlternative: matchedAlt };
        }
      }
    } else if (exercise.verifyByExecution) {
      isCorrect = await verifyWriteAnswer(pyodide, userAnswer, exercise.expectedAnswer);
    }

    return { isCorrect, infraAvailable: true, matchedAlternative: null };
  } catch (error) {
    return {
      isCorrect: false,
      infraAvailable: false,
      matchedAlternative: null,
      error: error instanceof Error ? error.message : 'Execution failed',
    };
  }
}

/**
 * Find which accepted solution matched the user's answer.
 */
function findMatchedAlternative(userAnswer: string, acceptedSolutions: string[]): string | null {
  const normalize = (s: string): string => s.trim().replace(/\n+$/, '');
  const normalizedUser = normalize(userAnswer);

  for (const alt of acceptedSolutions) {
    if (normalize(alt) === normalizedUser) {
      return alt;
    }
  }
  return null;
}

async function executeAstStrategy(
  pyodide: PyodideInterface,
  userAnswer: string,
  exercise: Exercise
): Promise<StrategyResult> {
  try {
    const result = await compareByAst(
      pyodide,
      userAnswer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions,
      {
        renameLocals: true,
        normalizeSlices: true,
        ignoreDocstrings: true,
      }
    );

    return {
      isCorrect: result.match,
      infraAvailable: result.infraAvailable,
      matchedAlternative: result.matchedAlternative,
      error: result.error,
    };
  } catch (error) {
    return {
      isCorrect: false,
      infraAvailable: false,
      matchedAlternative: null,
      error: error instanceof Error ? error.message : 'AST comparison failed',
    };
  }
}
