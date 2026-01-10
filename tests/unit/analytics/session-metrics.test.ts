import { describe, it, expect } from 'vitest';
import {
  buildSessionStartMetrics,
  buildExerciseMetrics,
  type SessionStartMetrics,
  type ExerciseMetrics,
} from '@/lib/analytics/session-metrics';

describe('buildSessionStartMetrics', () => {
  it('builds metrics with all required fields', () => {
    const metrics = buildSessionStartMetrics({
      reviewBacklog: 15,
      newCardLimit: 2,
      totalCards: 17,
    });

    expect(metrics.reviewBacklog).toBe(15);
    expect(metrics.newCardLimit).toBe(2);
    expect(metrics.totalCards).toBe(17);
    expect(metrics.timestamp).toBeInstanceOf(Date);
  });
});

describe('buildExerciseMetrics', () => {
  it('builds metrics for a practice exercise', () => {
    const metrics = buildExerciseMetrics({
      conceptSlug: 'loops',
      exerciseSlug: 'for-basic',
      wasCorrect: true,
      isNewSubconcept: true,
      conceptPosition: 3,
    });

    expect(metrics.conceptSlug).toBe('loops');
    expect(metrics.exerciseSlug).toBe('for-basic');
    expect(metrics.wasCorrect).toBe(true);
    expect(metrics.isNewSubconcept).toBe(true);
    expect(metrics.conceptPosition).toBe(3);
  });
});
