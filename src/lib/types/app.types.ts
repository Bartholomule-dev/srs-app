/**
 * App-layer types (camelCase for ergonomic usage)
 * These map to the database types but use JavaScript conventions.
 */

import type { Database } from './database.generated';

// Extract row types from generated types
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbExercise = Database['public']['Tables']['exercises']['Row'];
export type DbUserProgress = Database['public']['Tables']['user_progress']['Row'];

/**
 * User profile (camelCase)
 */
export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  preferredLanguage: string;
  dailyGoal: number;
  notificationTime: string | null;
  currentStreak: number;
  longestStreak: number;
  totalExercisesCompleted: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Exercise (camelCase)
 */
export interface Exercise {
  id: string;
  language: string;
  category: string;
  difficulty: number;
  title: string;
  prompt: string;
  expectedAnswer: string;
  hints: string[];
  explanation: string | null;
  tags: string[];
  timesPracticed: number;
  avgSuccessRate: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User progress (camelCase)
 */
export interface UserProgress {
  id: string;
  userId: string;
  exerciseId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReviewed: string | null;
  timesSeen: number;
  timesCorrect: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * SRS Quality rating (0-5)
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Supported languages
 */
export const LANGUAGES = ['python', 'javascript', 'typescript', 'sql'] as const;
export type Language = (typeof LANGUAGES)[number];

/**
 * Difficulty levels
 */
export const DIFFICULTIES = [1, 2, 3, 4, 5] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
