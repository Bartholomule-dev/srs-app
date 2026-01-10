// src/lib/srs/index.ts

// SRS constants
export { QUALITY_PASSING_THRESHOLD } from './constants';

// FSRS algorithm (primary SRS implementation)
export * from './fsrs';

// Exercise selection (algorithm-agnostic)
export {
  selectExercise,
  getUnderrepresentedType,
  selectExerciseByType,
  mapFSRSStateToPhase,
  LEVEL_ORDER,
} from './exercise-selection';

export type { SubconceptSelectionInfo } from './exercise-selection';

// Multi-target SRS credit/penalty logic
export { getTargetsToCredit, getTargetsToPenalize } from './multi-target';
