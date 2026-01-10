// Session-level instrumentation for analytics

/**
 * Metrics captured at session start for drop-off analysis.
 */
export interface SessionStartMetrics {
  reviewBacklog: number;
  newCardLimit: number;
  totalCards: number;
  timestamp: Date;
}

/**
 * Metrics captured for each exercise attempt.
 */
export interface ExerciseMetrics {
  conceptSlug: string;
  exerciseSlug: string;
  wasCorrect: boolean;
  isNewSubconcept: boolean;
  conceptPosition: number;
  timestamp: Date;
}

/**
 * Build session start metrics object.
 */
export function buildSessionStartMetrics(data: {
  reviewBacklog: number;
  newCardLimit: number;
  totalCards: number;
}): SessionStartMetrics {
  return {
    ...data,
    timestamp: new Date(),
  };
}

/**
 * Build exercise attempt metrics object.
 */
export function buildExerciseMetrics(data: {
  conceptSlug: string;
  exerciseSlug: string;
  wasCorrect: boolean;
  isNewSubconcept: boolean;
  conceptPosition: number;
}): ExerciseMetrics {
  return {
    ...data,
    timestamp: new Date(),
  };
}

/**
 * Log session start event.
 * Uses Vercel Analytics if available, otherwise console.
 */
export function logSessionStart(metrics: SessionStartMetrics): void {
  if (typeof window !== 'undefined' && 'va' in window) {
    (window as { va?: (event: string, data: Record<string, unknown>) => void }).va?.('event', {
      name: 'session_start',
      ...metrics,
      timestamp: metrics.timestamp.toISOString(),
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[SessionMetrics] start:', metrics);
  }
}

/**
 * Log session end event.
 */
export function logSessionEnd(data: {
  completed: boolean;
  conceptPosition: number;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
}): void {
  if (typeof window !== 'undefined' && 'va' in window) {
    (window as { va?: (event: string, data: Record<string, unknown>) => void }).va?.('event', {
      name: 'session_end',
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[SessionMetrics] end:', data);
  }
}
