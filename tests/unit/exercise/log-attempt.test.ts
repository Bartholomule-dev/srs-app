// tests/unit/exercise/log-attempt.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildAttemptRecord,
  type AttemptLogData,
} from '@/lib/exercise/log-attempt';
import type { GradingResult } from '@/lib/exercise/types';
import type { GeneratorParams } from '@/lib/generators/types';

describe('buildAttemptRecord', () => {
  const baseGradingResult: GradingResult = {
    isCorrect: true,
    usedTargetConstruct: true,
    coachingFeedback: null,
    gradingMethod: 'string',
    normalizedUserAnswer: 's[1:4]',
    normalizedExpectedAnswer: 's[1:4]',
    matchedAlternative: null,
  };

  it('builds record with basic fields', () => {
    const data: AttemptLogData = {
      userId: 'user-123',
      exerciseSlug: 'test-exercise',
      gradingResult: baseGradingResult,
      responseTimeMs: 5000,
      hintUsed: false,
      qualityScore: 4,
    };

    const record = buildAttemptRecord(data);

    expect(record.user_id).toBe('user-123');
    expect(record.exercise_slug).toBe('test-exercise');
    expect(record.grading_method).toBe('string');
    expect(record.response_time_ms).toBe(5000);
    expect(record.hint_used).toBe(false);
    expect(record.quality_score).toBe(4);
  });

  it('includes generated params when provided', () => {
    const params: GeneratorParams = { start: 1, end: 4 };
    const data: AttemptLogData = {
      userId: 'user-123',
      exerciseSlug: 'test-exercise',
      gradingResult: baseGradingResult,
      responseTimeMs: 5000,
      hintUsed: false,
      qualityScore: 4,
      generatedParams: params,
      seed: 'abc123',
    };

    const record = buildAttemptRecord(data);

    expect(record.generated_params).toEqual(params);
    expect(record.seed).toBe('abc123');
  });

  it('sets used_target_construct from grading result', () => {
    const data: AttemptLogData = {
      userId: 'user-123',
      exerciseSlug: 'test-exercise',
      gradingResult: {
        ...baseGradingResult,
        usedTargetConstruct: false,
        coachingFeedback: 'Try using slice notation',
      },
      responseTimeMs: 5000,
      hintUsed: false,
      qualityScore: 3,
    };

    const record = buildAttemptRecord(data);

    expect(record.used_target_construct).toBe(false);
    expect(record.coaching_shown).toBe(true);
  });

  it('sets coaching_shown to false when no feedback', () => {
    const data: AttemptLogData = {
      userId: 'user-123',
      exerciseSlug: 'test-exercise',
      gradingResult: baseGradingResult, // coachingFeedback is null
      responseTimeMs: 5000,
      hintUsed: false,
      qualityScore: 5,
    };

    const record = buildAttemptRecord(data);

    expect(record.coaching_shown).toBe(false);
  });

  it('handles null usedTargetConstruct', () => {
    const data: AttemptLogData = {
      userId: 'user-123',
      exerciseSlug: 'test-exercise',
      gradingResult: {
        ...baseGradingResult,
        usedTargetConstruct: null, // no target defined
      },
      responseTimeMs: 5000,
      hintUsed: false,
      qualityScore: 4,
    };

    const record = buildAttemptRecord(data);

    expect(record.used_target_construct).toBeNull();
  });

  it('records execution grading method', () => {
    const data: AttemptLogData = {
      userId: 'user-123',
      exerciseSlug: 'test-exercise',
      gradingResult: {
        ...baseGradingResult,
        gradingMethod: 'execution',
      },
      responseTimeMs: 2000,
      hintUsed: false,
      qualityScore: 5,
    };

    const record = buildAttemptRecord(data);

    expect(record.grading_method).toBe('execution');
  });
});
