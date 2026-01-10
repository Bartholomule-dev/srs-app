// src/lib/exercise/strategy-defaults.ts
import type { Exercise } from '@/lib/types';
import type { GradingStrategy } from './types';

export interface StrategyConfig {
  primary: GradingStrategy;
  fallback?: GradingStrategy;
}

const DEFAULT_STRATEGIES: Record<string, StrategyConfig> = {
  'fill-in': { primary: 'exact' },
  'predict': { primary: 'execution', fallback: 'exact' },
  'write': { primary: 'ast', fallback: 'exact' },
};

/** Fallback strategies for infra-dependent primary strategies */
const FALLBACK_FOR_STRATEGY: Partial<Record<GradingStrategy, GradingStrategy>> = {
  token: 'exact',
  execution: 'exact',
  ast: 'exact',
};

export function getDefaultStrategy(exercise: Exercise): StrategyConfig {
  // Explicit override takes precedence
  if (exercise.gradingStrategy) {
    const fallback = FALLBACK_FOR_STRATEGY[exercise.gradingStrategy];
    return { primary: exercise.gradingStrategy, fallback };
  }

  // Verification script implies execution
  if (exercise.verificationScript) {
    return { primary: 'execution', fallback: 'token' };
  }

  // Legacy flag support
  if (exercise.verifyByExecution) {
    return { primary: 'execution', fallback: 'token' };
  }

  // Type-based defaults
  return DEFAULT_STRATEGIES[exercise.exerciseType] ?? { primary: 'exact' };
}
