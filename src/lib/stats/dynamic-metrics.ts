// src/lib/stats/dynamic-metrics.ts
// Success metric calculations for dynamic exercise system

/**
 * Retention metric - measures performance improvement over time.
 */
export interface RetentionMetric {
  /** Accuracy on first attempt of each exercise */
  firstAttemptAccuracy: number;
  /** Accuracy on subsequent attempts */
  subsequentAccuracy: number;
  /** Difference (positive = improvement) */
  retentionDelta: number;
  /** Total attempts analyzed */
  sampleSize: number;
}

/**
 * Transfer metric - measures performance on novel exercises.
 */
export interface TransferMetric {
  /** Total transfer assessments */
  assessmentCount: number;
  /** Correct on first try */
  correctCount: number;
  /** Overall transfer rate */
  transferRate: number;
  /** Breakdown by subconcept */
  bySubconcept: Record<string, { correct: number; total: number; rate: number }>;
}

/**
 * Construct adoption metric - measures usage of target constructs.
 */
export interface ConstructAdoptionMetric {
  /** Exercises with target construct defined */
  totalWithTarget: number;
  /** Exercises where user used target construct */
  usedTarget: number;
  /** Adoption rate */
  adoptionRate: number;
  /** Trend compared to previous period */
  trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Completion stability metric - measures session completion health.
 */
export interface CompletionStabilityMetric {
  /** Total sessions started */
  totalSessions: number;
  /** Sessions completed fully */
  completedSessions: number;
  /** Sessions abandoned early */
  abandonedSessions: number;
  /** Abandon rate */
  abandonRate: number;
  /** Average hint usage rate */
  avgHintUsage: number;
  /** Average retries on failed exercises */
  avgRetryCount: number;
}

/**
 * Calculate retention rate for a user.
 */
export async function calculateRetentionRate(
  userId: string,
  daysBack: number = 30
): Promise<RetentionMetric | null> {
  // Dynamic import to avoid Supabase initialization during module load in tests
  const { supabase } = await import('@/lib/supabase/client');
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // Query attempts grouped by first vs subsequent
  const { data, error } = await supabase
    .from('exercise_attempts')
    .select('exercise_slug, times_seen, times_correct')
    .eq('user_id', userId)
    .gte('attempted_at', since.toISOString());

  if (error || !data || data.length === 0) {
    return null;
  }

  // Calculate first attempt accuracy (times_seen = 1)
  // and subsequent accuracy (times_seen > 1)
  let firstCorrect = 0;
  let firstTotal = 0;
  let subsequentCorrect = 0;
  let subsequentTotal = 0;

  for (const row of data) {
    // First attempt
    if (row.times_seen >= 1) {
      firstTotal++;
      if (row.times_correct >= 1) {
        firstCorrect++;
      }
    }
    // Subsequent attempts
    if (row.times_seen > 1) {
      subsequentTotal += row.times_seen - 1;
      subsequentCorrect += Math.max(0, row.times_correct - 1);
    }
  }

  const firstAttemptAccuracy = firstTotal > 0 ? firstCorrect / firstTotal : 0;
  const subsequentAccuracy = subsequentTotal > 0 ? subsequentCorrect / subsequentTotal : 0;

  return {
    firstAttemptAccuracy,
    subsequentAccuracy,
    retentionDelta: subsequentAccuracy - firstAttemptAccuracy,
    sampleSize: firstTotal + subsequentTotal,
  };
}

/**
 * Calculate transfer rate for a user.
 */
export async function calculateTransferRate(
  userId: string,
  daysBack: number = 30
): Promise<TransferMetric | null> {
  // Dynamic import to avoid Supabase initialization during module load in tests
  const { supabase } = await import('@/lib/supabase/client');
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data, error } = await supabase
    .from('transfer_assessments')
    .select('subconcept_slug, was_correct')
    .eq('user_id', userId)
    .gte('assessed_at', since.toISOString());

  if (error || !data || data.length === 0) {
    return null;
  }

  const bySubconcept: TransferMetric['bySubconcept'] = {};
  let correctCount = 0;

  for (const row of data) {
    if (row.was_correct) correctCount++;

    if (!bySubconcept[row.subconcept_slug]) {
      bySubconcept[row.subconcept_slug] = { correct: 0, total: 0, rate: 0 };
    }
    bySubconcept[row.subconcept_slug].total++;
    if (row.was_correct) {
      bySubconcept[row.subconcept_slug].correct++;
    }
  }

  // Calculate rates
  for (const slug of Object.keys(bySubconcept)) {
    const stats = bySubconcept[slug];
    stats.rate = stats.total > 0 ? stats.correct / stats.total : 0;
  }

  return {
    assessmentCount: data.length,
    correctCount,
    transferRate: data.length > 0 ? correctCount / data.length : 0,
    bySubconcept,
  };
}

/**
 * Calculate construct adoption rate for a user.
 */
export async function calculateConstructAdoptionRate(
  userId: string,
  daysBack: number = 30
): Promise<ConstructAdoptionMetric | null> {
  // Dynamic import to avoid Supabase initialization during module load in tests
  const { supabase } = await import('@/lib/supabase/client');
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data, error } = await supabase
    .from('exercise_attempts')
    .select('used_target_construct')
    .eq('user_id', userId)
    .not('used_target_construct', 'is', null)
    .gte('attempted_at', since.toISOString());

  if (error || !data || data.length === 0) {
    return null;
  }

  const usedTarget = data.filter((r) => r.used_target_construct === true).length;

  // For trend, compare to previous period
  const previousSince = new Date();
  previousSince.setDate(previousSince.getDate() - daysBack * 2);

  const { data: previousData } = await supabase
    .from('exercise_attempts')
    .select('used_target_construct')
    .eq('user_id', userId)
    .not('used_target_construct', 'is', null)
    .gte('attempted_at', previousSince.toISOString())
    .lt('attempted_at', since.toISOString());

  let trend: ConstructAdoptionMetric['trend'] = 'stable';
  if (previousData && previousData.length > 0) {
    const previousRate =
      previousData.filter((r) => r.used_target_construct === true).length /
      previousData.length;
    const currentRate = usedTarget / data.length;

    if (currentRate > previousRate + 0.05) {
      trend = 'increasing';
    } else if (currentRate < previousRate - 0.05) {
      trend = 'decreasing';
    }
  }

  return {
    totalWithTarget: data.length,
    usedTarget,
    adoptionRate: data.length > 0 ? usedTarget / data.length : 0,
    trend,
  };
}

/**
 * Calculate completion stability metrics for a user.
 */
export async function calculateCompletionStability(
  userId: string,
  daysBack: number = 30
): Promise<CompletionStabilityMetric | null> {
  // Dynamic import to avoid Supabase initialization during module load in tests
  const { supabase } = await import('@/lib/supabase/client');
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // Query all attempts with hint usage
  const { data, error } = await supabase
    .from('exercise_attempts')
    .select('hint_used, times_seen, times_correct')
    .eq('user_id', userId)
    .gte('attempted_at', since.toISOString());

  if (error || !data || data.length === 0) {
    return null;
  }

  // Calculate hint usage rate
  const withHints = data.filter((r) => r.hint_used).length;
  const avgHintUsage = data.length > 0 ? withHints / data.length : 0;

  // Calculate retry count (times_seen - 1 for exercises seen multiple times)
  const retries = data.reduce((sum, r) => sum + Math.max(0, r.times_seen - 1), 0);
  const exercisesWithRetries = data.filter((r) => r.times_seen > 1).length;
  const avgRetryCount = exercisesWithRetries > 0 ? retries / exercisesWithRetries : 0;

  // Session data would need separate tracking; placeholder for now
  // In a real implementation, you'd track session starts/completions
  return {
    totalSessions: 0, // Would need session tracking
    completedSessions: 0,
    abandonedSessions: 0,
    abandonRate: 0,
    avgHintUsage,
    avgRetryCount,
  };
}

/**
 * Get all success metrics for a user.
 */
export interface SuccessMetrics {
  retention: RetentionMetric | null;
  transfer: TransferMetric | null;
  constructAdoption: ConstructAdoptionMetric | null;
  completionStability: CompletionStabilityMetric | null;
}

export async function getSuccessMetrics(
  userId: string,
  daysBack: number = 30
): Promise<SuccessMetrics> {
  const [retention, transfer, constructAdoption, completionStability] =
    await Promise.all([
      calculateRetentionRate(userId, daysBack),
      calculateTransferRate(userId, daysBack),
      calculateConstructAdoptionRate(userId, daysBack),
      calculateCompletionStability(userId, daysBack),
    ]);

  return {
    retention,
    transfer,
    constructAdoption,
    completionStability,
  };
}
