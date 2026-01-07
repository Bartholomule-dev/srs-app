// src/lib/stats/index.ts
export type { UserStats, DailyStats } from './types';
export { getCardsReviewedToday, getTotalAccuracy } from './queries';
export {
  shouldIncrementStreak,
  calculateUpdatedStreak,
  type StreakUpdateInput,
  type StreakUpdateResult,
} from './streak';
export {
  updateProfileStats,
  type UpdateProfileStatsInput,
} from './updateProfile';

// Dynamic exercise metrics
export {
  calculateRetentionRate,
  calculateTransferRate,
  calculateConstructAdoptionRate,
  calculateCompletionStability,
  getSuccessMetrics,
  type RetentionMetric,
  type TransferMetric,
  type ConstructAdoptionMetric,
  type CompletionStabilityMetric,
  type SuccessMetrics,
} from './dynamic-metrics';
