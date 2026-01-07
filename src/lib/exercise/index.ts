// src/lib/exercise/index.ts
export type { AnswerResult, QualityInputs, GradingMethod, GradingResult, ConstructCheckResult } from './types';
export { normalizePython, checkAnswer, checkAnswerWithAlternatives, checkFillInAnswer, checkPredictAnswer } from './matching';
export { inferQuality, FAST_THRESHOLD_MS, SLOW_THRESHOLD_MS } from './quality';
export { gradeAnswer, shouldShowCoaching } from './grading';
export { checkConstruct, checkAnyConstruct, CONSTRUCT_PATTERNS } from './construct-check';
export * from './yaml-types';
export * from './yaml-validation';

// Attempt logging
export {
  logExerciseAttempt,
  logTransferAssessment,
  buildAttemptRecord,
  type AttemptLogData,
  type AttemptRecord,
  type TransferAssessmentData,
} from './log-attempt';
