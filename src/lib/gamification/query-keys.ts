/**
 * React Query key factory and stale time configuration for gamification queries.
 *
 * Query keys follow the pattern: ['gamification', <resource>, <userId>]
 * This enables granular cache invalidation at both resource and user levels.
 */

/**
 * Query key types for type-safe staleTime configuration
 */
export type GamificationQueryType =
  | 'points'
  | 'contributions'
  | 'achievements'
  | 'streak';

/**
 * Query key factory for gamification-related React Query hooks.
 * All keys share the 'gamification' prefix for easy cache management.
 */
export const gamificationQueryKeys = {
  /**
   * Query key for user points data.
   * Points should always be fresh (staleTime: 0) as they change frequently.
   */
  points: (userId: string) => ['gamification', 'points', userId] as const,

  /**
   * Query key for user contribution heatmap data.
   * Contributions are stable once set for a day (staleTime: 5 minutes).
   */
  contributions: (userId: string) =>
    ['gamification', 'contributions', userId] as const,

  /**
   * Query key for user achievements list.
   * Achievements change infrequently but should update reasonably quickly (staleTime: 1 minute).
   */
  achievements: (userId: string) =>
    ['gamification', 'achievements', userId] as const,

  /**
   * Query key for user streak data.
   * Streak updates once per day but should reflect recent activity (staleTime: 1 minute).
   */
  streak: (userId: string) => ['gamification', 'streak', userId] as const,
} as const;

/**
 * Stale time configuration in milliseconds for each query type.
 *
 * - points: 0 (always fresh) - changes with every exercise completion
 * - contributions: 5 minutes - stable once set for the day
 * - achievements: 1 minute - infrequent changes but should update reasonably
 * - streak: 1 minute - updates once per day but recent activity matters
 */
const STALE_TIMES: Record<GamificationQueryType, number> = {
  points: 0,
  contributions: 5 * 60 * 1000, // 5 minutes
  achievements: 60 * 1000, // 1 minute
  streak: 60 * 1000, // 1 minute
};

/**
 * Get the stale time for a gamification query type.
 * Used to configure React Query's staleTime option.
 *
 * @param type - The gamification query type
 * @returns Stale time in milliseconds
 */
export function getStaleTime(type: GamificationQueryType): number {
  return STALE_TIMES[type];
}
