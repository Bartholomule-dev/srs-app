/**
 * Mappers between database (snake_case) and app (camelCase) types
 */

import type { DbProfile, DbExercise, Profile, Exercise, ExperienceLevel } from '../types/app.types';

/**
 * Map database profile to app profile
 */
export function mapProfile(db: DbProfile): Profile {
  // Type assertion for fields until database types are regenerated
  const dbExt = db as DbProfile & {
    experience_level?: string | null;
    recent_skins?: string[] | null;
  };

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
    experienceLevel: (dbExt.experience_level as ExperienceLevel) ?? 'refresher',
    recentSkins: dbExt.recent_skins ?? [],
    createdAt: db.created_at ?? new Date().toISOString(),
    updatedAt: db.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Map database exercise to app exercise
 * Note: Uses type assertion for Phase 2.5 fields (objective, targets) and
 * dynamic exercise fields until database migration is applied and types are regenerated.
 */
export function mapExercise(db: DbExercise): Exercise {
  // Type assertion for fields not yet in generated database types
  const dbExt = db as DbExercise & {
    objective?: string | null;
    targets?: string[] | null;
    code?: string | null;
    // Dynamic exercise fields (Phase 1)
    generator?: string | null;
    target_construct?: { type: string; feedback?: string } | null;
    verify_by_execution?: boolean | null;
    // Grading strategy fields (Phase 3C)
    grading_strategy?: 'exact' | 'token' | 'ast' | 'execution' | null;
    verification_script?: string | null;
  };

  return {
    id: db.id,
    slug: db.slug,
    language: db.language,
    category: db.category,
    difficulty: db.difficulty,
    title: db.title,
    prompt: db.prompt,
    expectedAnswer: db.expected_answer,
    acceptedSolutions: db.accepted_solutions ?? [],
    hints: (db.hints as string[]) ?? [],
    explanation: db.explanation,
    tags: db.tags ?? [],
    timesPracticed: db.times_practiced ?? 0,
    avgSuccessRate: db.avg_success_rate,
    createdAt: db.created_at ?? new Date().toISOString(),
    updatedAt: db.updated_at ?? new Date().toISOString(),
    // Taxonomy fields (Phase 2)
    concept: (db.concept ?? 'foundations') as Exercise['concept'],
    subconcept: db.subconcept ?? 'basics',
    level: (db.level ?? 'intro') as Exercise['level'],
    prereqs: db.prereqs ?? [],
    exerciseType: (db.exercise_type ?? 'write') as Exercise['exerciseType'],
    pattern: (db.pattern ?? 'construction') as Exercise['pattern'],
    template: db.template ?? null,
    blankPosition: db.blank_position ?? null,
    // Phase 2.5 fields (using extended type until migration)
    objective: dbExt.objective ?? '',
    targets: dbExt.targets ?? null,
    // Phase 2.7: predict-output exercise code
    code: dbExt.code ?? undefined,
    // Dynamic exercise fields (Phase 1)
    generator: dbExt.generator ?? undefined,
    targetConstruct: dbExt.target_construct ? {
      type: dbExt.target_construct.type,
      feedback: dbExt.target_construct.feedback,
    } : undefined,
    verifyByExecution: dbExt.verify_by_execution ?? false,
    // Grading strategy fields (Phase 3C)
    gradingStrategy: dbExt.grading_strategy ?? undefined,
    verificationScript: dbExt.verification_script ?? undefined,
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
  if (app.experienceLevel !== undefined) db.experience_level = app.experienceLevel;
  return db;
}


