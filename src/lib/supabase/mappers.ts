/**
 * Mappers between database (snake_case) and app (camelCase) types
 */

import type { DbProfile, DbExercise, DbUserProgress, Profile, Exercise, UserProgress } from '../types/app.types';

/**
 * Map database profile to app profile
 */
export function mapProfile(db: DbProfile): Profile {
  return {
    id: db.id,
    username: db.username,
    displayName: db.display_name,
    avatarUrl: db.avatar_url,
    preferredLanguage: db.preferred_language ?? 'python',
    dailyGoal: db.daily_goal ?? 10,
    notificationTime: db.notification_time,
    currentStreak: db.current_streak ?? 0,
    longestStreak: db.longest_streak ?? 0,
    totalExercisesCompleted: db.total_exercises_completed ?? 0,
    createdAt: db.created_at ?? new Date().toISOString(),
    updatedAt: db.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Map database exercise to app exercise
 */
export function mapExercise(db: DbExercise): Exercise {
  return {
    id: db.id,
    language: db.language,
    category: db.category,
    difficulty: db.difficulty,
    title: db.title,
    prompt: db.prompt,
    expectedAnswer: db.expected_answer,
    hints: (db.hints as string[]) ?? [],
    explanation: db.explanation,
    tags: db.tags ?? [],
    timesPracticed: db.times_practiced ?? 0,
    avgSuccessRate: db.avg_success_rate,
    createdAt: db.created_at ?? new Date().toISOString(),
    updatedAt: db.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Map database progress to app progress
 */
export function mapUserProgress(db: DbUserProgress): UserProgress {
  return {
    id: db.id,
    userId: db.user_id,
    exerciseId: db.exercise_id,
    easeFactor: Number(db.ease_factor),
    interval: db.interval ?? 0,
    repetitions: db.repetitions ?? 0,
    nextReview: db.next_review ?? new Date().toISOString(),
    lastReviewed: db.last_reviewed,
    timesSeen: db.times_seen ?? 0,
    timesCorrect: db.times_correct ?? 0,
    createdAt: db.created_at ?? new Date().toISOString(),
    updatedAt: db.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Map app profile updates to database format
 */
export function toDbProfileUpdate(app: Partial<Omit<Profile, 'id' | 'createdAt'>>) {
  const db: Record<string, unknown> = {};
  if (app.displayName !== undefined) db.display_name = app.displayName;
  if (app.username !== undefined) db.username = app.username;
  if (app.avatarUrl !== undefined) db.avatar_url = app.avatarUrl;
  if (app.preferredLanguage !== undefined) db.preferred_language = app.preferredLanguage;
  if (app.dailyGoal !== undefined) db.daily_goal = app.dailyGoal;
  if (app.notificationTime !== undefined) db.notification_time = app.notificationTime;
  if (app.currentStreak !== undefined) db.current_streak = app.currentStreak;
  if (app.longestStreak !== undefined) db.longest_streak = app.longestStreak;
  if (app.totalExercisesCompleted !== undefined) db.total_exercises_completed = app.totalExercisesCompleted;
  return db;
}
