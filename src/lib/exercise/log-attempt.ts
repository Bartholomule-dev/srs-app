// src/lib/exercise/log-attempt.ts
// Audit logging for exercise attempts

import type { GradingResult } from './types';
import type { GeneratorParams } from '@/lib/generators/types';

/**
 * Data required to log an exercise attempt.
 */
export interface AttemptLogData {
  userId: string;
  exerciseSlug: string;
  gradingResult: GradingResult;
  responseTimeMs: number;
  hintUsed: boolean;
  qualityScore: number;
  generatedParams?: GeneratorParams;
  seed?: string;
  /** Programming language (default: 'python') */
  language?: string;
}

/**
 * Database record shape for exercise_attempts insert.
 */
export interface AttemptRecord {
  user_id: string;
  exercise_slug: string;
  language: string;
  times_seen: number;
  times_correct: number;
  last_seen_at: string;
  generated_params: GeneratorParams | null;
  seed: string | null;
  grading_method: string;
  used_target_construct: boolean | null;
  coaching_shown: boolean;
  response_time_ms: number;
  hint_used: boolean;
  quality_score: number;
  attempted_at: string;
  is_correct: boolean;
}

/**
 * Build an attempt record for database insert.
 */
export function buildAttemptRecord(data: AttemptLogData): AttemptRecord {
  const now = new Date().toISOString();
  const coachingShown = data.gradingResult.coachingFeedback !== null;

  return {
    user_id: data.userId,
    exercise_slug: data.exerciseSlug,
    language: data.language ?? 'python',
    times_seen: 1, // Will be incremented via upsert
    times_correct: data.gradingResult.isCorrect ? 1 : 0,
    last_seen_at: now,
    generated_params: data.generatedParams ?? null,
    seed: data.seed ?? null,
    grading_method: data.gradingResult.gradingMethod,
    used_target_construct: data.gradingResult.usedTargetConstruct,
    coaching_shown: coachingShown,
    response_time_ms: data.responseTimeMs,
    hint_used: data.hintUsed,
    quality_score: data.qualityScore,
    attempted_at: now,
    is_correct: data.gradingResult.isCorrect,
  };
}

/**
 * Log an exercise attempt to the database.
 *
 * Uses upsert to increment times_seen/times_correct for returning exercises.
 */
export async function logExerciseAttempt(data: AttemptLogData): Promise<void> {
  // Dynamic import to avoid Supabase initialization during module load in tests
  const { supabase } = await import('@/lib/supabase/client');
  const record = buildAttemptRecord(data);
  const language = data.language ?? 'python';

  // First, try to get existing record
  // Using maybeSingle() to avoid 406 error when no record exists
  const { data: existing } = await supabase
    .from('exercise_attempts')
    .select('times_seen, times_correct')
    .eq('user_id', data.userId)
    .eq('exercise_slug', data.exerciseSlug)
    .eq('language', language)
    .maybeSingle();

  if (existing) {
    // Update existing record
    await supabase
      .from('exercise_attempts')
      .update({
        times_seen: existing.times_seen + 1,
        times_correct: existing.times_correct + (data.gradingResult.isCorrect ? 1 : 0),
        last_seen_at: record.last_seen_at,
        generated_params: record.generated_params,
        seed: record.seed,
        grading_method: record.grading_method,
        used_target_construct: record.used_target_construct,
        coaching_shown: record.coaching_shown,
        response_time_ms: record.response_time_ms,
        hint_used: record.hint_used,
        quality_score: record.quality_score,
        attempted_at: record.attempted_at,
        is_correct: record.is_correct,
      })
      .eq('user_id', data.userId)
      .eq('exercise_slug', data.exerciseSlug)
      .eq('language', language);
  } else {
    // Insert new record
    await supabase.from('exercise_attempts').insert(record);
  }
}

/**
 * Log a transfer assessment (performance on novel exercise).
 */
export interface TransferAssessmentData {
  userId: string;
  subconceptSlug: string;
  exerciseSlug: string;
  wasCorrect: boolean;
  practiceCount: number;
  lastPracticeAt: Date | null;
  gradingMethod?: string;
  responseTimeMs?: number;
}

export async function logTransferAssessment(
  data: TransferAssessmentData
): Promise<void> {
  // Dynamic import to avoid Supabase initialization during module load in tests
  const { supabase } = await import('@/lib/supabase/client');
  await supabase.from('transfer_assessments').insert({
    user_id: data.userId,
    subconcept_slug: data.subconceptSlug,
    exercise_slug: data.exerciseSlug,
    was_correct: data.wasCorrect,
    practice_count: data.practiceCount,
    last_practice_at: data.lastPracticeAt?.toISOString() ?? null,
    grading_method: data.gradingMethod ?? null,
    response_time_ms: data.responseTimeMs ?? null,
  });
}
