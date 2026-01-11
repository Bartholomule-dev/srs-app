// src/lib/exercise/strategy-router.ts
import type { Exercise, Language } from '@/lib/types';
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import type { GradingStrategy } from './types';
import { getDefaultStrategy } from './strategy-defaults';
import { checkAnswerWithAlternatives, checkFillInAnswer, checkPredictAnswer } from './matching';
import { compareByTokens } from './token-compare';
import { compareByAst } from './ast-compare';
import { verifyWithScript } from './verification';
import { verifyPredictAnswer, verifyWriteAnswer } from './execution';
import { getRuntimeForLanguage, type LanguageRuntime, type PythonRuntime } from '@/lib/runtime';

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

/**
 * Grade a user's answer using the appropriate strategy for the exercise.
 * Supports multiple languages by routing to the appropriate runtime.
 *
 * @param userAnswer - The user's submitted answer
 * @param exercise - The exercise being graded
 * @param pyodide - Pyodide instance (for backwards compatibility with Python)
 * @param language - Optional explicit language override (defaults to exercise.language or 'python')
 */
export async function gradeWithStrategy(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null,
  language?: Language
): Promise<GradingWithStrategyResult> {
  const config = getDefaultStrategy(exercise);

  // Determine the language: explicit param > exercise.language > 'python'
  const lang = language ?? (exercise.language as Language) ?? 'python';

  // Get the appropriate runtime for this language
  const runtime = getRuntimeForLanguage(lang);

  // For Python runtime, set the Pyodide instance if available
  // This maintains backwards compatibility with the existing Pyodide-based flow
  if (lang === 'python' && pyodide && runtime) {
    (runtime as PythonRuntime).setPyodide(pyodide);
  }

  // Try primary strategy
  const result = await executeStrategy(config.primary, userAnswer, exercise, pyodide, runtime, lang);

  // Only fall back if infrastructure was unavailable
  if (!result.infraAvailable && config.fallback) {
    console.warn(`Strategy '${config.primary}' unavailable, falling back to '${config.fallback}'`);
    const fallbackResult = await executeStrategy(config.fallback, userAnswer, exercise, pyodide, runtime, lang);
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
  pyodide: PyodideInterface | null,
  runtime: LanguageRuntime | undefined,
  language: Language
): Promise<StrategyResult> {
  switch (strategy) {
    case 'exact':
      return executeExactStrategy(userAnswer, exercise);

    case 'token':
      // For non-Python languages, use the runtime directly
      if (language !== 'python' && runtime) {
        return executeTokenStrategyWithRuntime(runtime, userAnswer, exercise);
      }
      // For Python, use Pyodide (backwards compatibility)
      if (!pyodide) {
        return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
      }
      return executeTokenStrategy(pyodide, userAnswer, exercise);

    case 'execution':
      return executeExecutionStrategy(userAnswer, exercise, pyodide, runtime, language);

    case 'ast':
      // For non-Python languages, use the runtime directly
      if (language !== 'python' && runtime) {
        return executeAstStrategyWithRuntime(runtime, userAnswer, exercise);
      }
      // For Python, use Pyodide (backwards compatibility)
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

/**
 * Execute token comparison strategy using the language runtime.
 * Used for non-Python languages that have their own token comparison.
 */
async function executeTokenStrategyWithRuntime(
  runtime: LanguageRuntime,
  userAnswer: string,
  exercise: Exercise
): Promise<StrategyResult> {
  try {
    const result = await runtime.compareByTokens(
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

/**
 * Execute AST comparison strategy using the language runtime.
 * Used for non-Python languages that have their own AST comparison.
 */
async function executeAstStrategyWithRuntime(
  runtime: LanguageRuntime,
  userAnswer: string,
  exercise: Exercise
): Promise<StrategyResult> {
  try {
    const result = await runtime.compareByAst(
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

async function executeExecutionStrategy(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null,
  runtime: LanguageRuntime | undefined,
  language: Language
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

  // For non-Python languages, use the runtime for execution
  // Note: runtime.execute() auto-initializes if needed
  if (language !== 'python' && runtime) {
    return executeWithRuntime(runtime, userAnswer, exercise);
  }

  // Python output-based execution requires Pyodide
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
 * Execute code using the language runtime and compare output.
 * Used for non-Python languages with execution-based verification.
 */
async function executeWithRuntime(
  runtime: LanguageRuntime,
  userAnswer: string,
  exercise: Exercise
): Promise<StrategyResult> {
  try {
    // For predict exercises, execute the code and compare output
    if (exercise.exerciseType === 'predict' && exercise.code) {
      const result = await runtime.execute(exercise.code);

      if (!result.success) {
        return {
          isCorrect: false,
          infraAvailable: true,
          matchedAlternative: null,
          error: result.error || 'Execution failed',
        };
      }

      // Normalize both outputs for comparison
      const normalizedOutput = (result.output || '').trim();
      const normalizedUserAnswer = userAnswer.trim();

      let isCorrect = normalizedOutput === normalizedUserAnswer;

      // Check accepted solutions if direct comparison failed
      if (!isCorrect && exercise.acceptedSolutions && exercise.acceptedSolutions.length > 0) {
        isCorrect = checkPredictAnswer(userAnswer, exercise.expectedAnswer, exercise.acceptedSolutions);
        if (isCorrect) {
          const matchedAlt = findMatchedAlternative(userAnswer, exercise.acceptedSolutions);
          return { isCorrect: true, infraAvailable: true, matchedAlternative: matchedAlt };
        }
      }

      return { isCorrect, infraAvailable: true, matchedAlternative: null };
    }

    // For write exercises with verifyByExecution, execute both and compare outputs
    if (exercise.verifyByExecution) {
      const userResult = await runtime.execute(userAnswer);
      const expectedResult = await runtime.execute(exercise.expectedAnswer);

      if (!userResult.success || !expectedResult.success) {
        return {
          isCorrect: false,
          infraAvailable: true,
          matchedAlternative: null,
          error: userResult.error || expectedResult.error || 'Execution failed',
        };
      }

      const isCorrect = (userResult.output || '').trim() === (expectedResult.output || '').trim();
      return { isCorrect, infraAvailable: true, matchedAlternative: null };
    }

    // No execution-based verification for this exercise type
    return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
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
