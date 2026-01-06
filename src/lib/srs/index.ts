// src/lib/srs/index.ts

// Exercise-based SRS (legacy)
export {
  calculateNextReview,
  createInitialCardState,
  getDueCards,
  getNewCards,
} from './algorithm';

export type {
  CardState,
  ReviewResult,
  SRSConfig,
  DueCard,
} from './types';

export { DEFAULT_SRS_CONFIG } from './types';

// Concept-based SRS (new)
export {
  getDueSubconcepts,
  selectExercise,
  calculateSubconceptReview,
  createInitialSubconceptState,
  getUnderrepresentedType,
  selectExerciseByType,
  LEVEL_ORDER,
  GRADUATING_INTERVAL,
  MIN_EASE_FACTOR,
  MAX_EASE_FACTOR,
  INITIAL_EASE_FACTOR,
} from './concept-algorithm';

export type { SubconceptReviewResult } from './concept-algorithm';

// Multi-target credit/penalty logic
export { getTargetsToCredit, getTargetsToPenalize } from './multi-target';
