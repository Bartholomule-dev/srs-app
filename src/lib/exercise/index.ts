// src/lib/exercise/index.ts
export type { AnswerResult, QualityInputs, GradingMethod, GradingStrategy, GradingResult, ConstructCheckResult } from './types';
export { normalizePython, checkAnswer, checkAnswerWithAlternatives, checkFillInAnswer, checkPredictAnswer } from './matching';
export { inferQuality, FAST_THRESHOLD_MS, SLOW_THRESHOLD_MS, MIN_REPS_FOR_EASY } from './quality';
export { gradeAnswer, shouldShowCoaching, gradeAnswerAsync } from './grading';
export { checkConstruct, checkAnyConstruct, CONSTRUCT_PATTERNS } from './construct-check';
export * from './yaml-types';
export * from './yaml-validation';

// Execution
export {
  executePythonCode,
  verifyPredictAnswer,
  verifyWriteAnswer,
  captureStdout,
  type ExecutionResult,
  type ExecutionOptions,
} from './execution';

// Attempt logging
export {
  logExerciseAttempt,
  logTransferAssessment,
  buildAttemptRecord,
  type AttemptLogData,
  type AttemptRecord,
  type TransferAssessmentData,
} from './log-attempt';

// Telemetry
export * from './telemetry';

// Verification scripts
export * from './verification';

// Token comparison
export * from './token-compare';

// Strategy routing
export * from './strategy-defaults';
export * from './strategy-router';

// AST comparison
export * from './ast-compare';
