/**
 * App-layer types (camelCase for ergonomic usage)
 * These map to the database types but use JavaScript conventions.
 */

import type { Database } from './database.generated';
import type {
  ConceptSlug,
  ExerciseLevel,
  ExerciseType,
  ExercisePattern,
} from '../curriculum/types';

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
  experienceLevel: ExperienceLevel;
  createdAt: string;
  updatedAt: string;
}

/**
 * Exercise (camelCase)
 */
export interface Exercise {
  id: string;
  slug: string;
  language: string;
  category: string;
  difficulty: number;
  title: string;
  prompt: string;
  expectedAnswer: string;
  acceptedSolutions: string[]; // Alternative valid answers
  hints: string[];
  explanation: string | null;
  tags: string[];
  timesPracticed: number;
  avgSuccessRate: number | null;
  createdAt: string;
  updatedAt: string;

  // New taxonomy fields
  concept: ConceptSlug;
  subconcept: string;
  level: ExerciseLevel;
  prereqs: string[];
  exerciseType: ExerciseType; // 'type' is reserved, use 'exerciseType'
  pattern: ExercisePattern;

  // Learning objective
  objective: string;

  // Multi-subconcept targeting (for integrated exercises)
  targets: string[] | null;

  // Fill-in specific (optional)
  template: string | null;
  blankPosition: number | null;

  // Predict-output specific (optional)
  code?: string;
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

/**
 * Experience level for exercise type ratios
 * - refresher: Experienced developers brushing up (mostly write exercises)
 * - learning: Intermediate developers building skills (balanced mix)
 * - beginner: New developers learning fundamentals (more scaffolded exercises)
 */
export type ExperienceLevel = 'refresher' | 'learning' | 'beginner';

/**
 * Exercise type ratios by experience level
 * Determines the mix of write/fill-in/predict exercises in sessions
 */
export const EXPERIENCE_LEVEL_RATIOS = {
  refresher: { write: 0.8, 'fill-in': 0.1, predict: 0.1 },
  learning: { write: 0.5, 'fill-in': 0.25, predict: 0.25 },
  beginner: { write: 0.3, 'fill-in': 0.35, predict: 0.35 },
} as const;
