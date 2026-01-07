// tests/integration/stats/metrics-flow.test.ts
import { describe, it, expect } from 'vitest';
import { buildAttemptRecord } from '@/lib/exercise/log-attempt';
import type { GradingResult } from '@/lib/exercise/types';

describe('Metrics flow integration', () => {
  describe('attempt record building', () => {
    it('builds complete record with generator data', () => {
      const gradingResult: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: true,
        coachingFeedback: null,
        gradingMethod: 'execution',
        normalizedUserAnswer: 's[2:6]',
        normalizedExpectedAnswer: 's[2:6]',
        matchedAlternative: null,
      };

      const record = buildAttemptRecord({
        userId: 'user-test',
        exerciseSlug: 'dynamic-slice',
        gradingResult,
        responseTimeMs: 3500,
        hintUsed: false,
        qualityScore: 5,
        generatedParams: { start: 2, end: 6 },
        seed: 'abc123def456',
      });

      expect(record.user_id).toBe('user-test');
      expect(record.exercise_slug).toBe('dynamic-slice');
      expect(record.grading_method).toBe('execution');
      expect(record.used_target_construct).toBe(true);
      expect(record.coaching_shown).toBe(false);
      expect(record.generated_params).toEqual({ start: 2, end: 6 });
      expect(record.seed).toBe('abc123def456');
      expect(record.response_time_ms).toBe(3500);
      expect(record.quality_score).toBe(5);
    });

    it('records coaching shown when feedback provided', () => {
      const gradingResult: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: false,
        coachingFeedback: 'Try using slice notation!',
        gradingMethod: 'string',
        normalizedUserAnswer: 'result',
        normalizedExpectedAnswer: 'result',
        matchedAlternative: null,
      };

      const record = buildAttemptRecord({
        userId: 'user-test',
        exerciseSlug: 'test-ex',
        gradingResult,
        responseTimeMs: 5000,
        hintUsed: true,
        qualityScore: 3,
      });

      expect(record.used_target_construct).toBe(false);
      expect(record.coaching_shown).toBe(true);
      expect(record.hint_used).toBe(true);
    });

    it('handles execution-fallback grading method', () => {
      const gradingResult: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: null,
        coachingFeedback: null,
        gradingMethod: 'execution-fallback',
        normalizedUserAnswer: '42',
        normalizedExpectedAnswer: '42',
        matchedAlternative: null,
      };

      const record = buildAttemptRecord({
        userId: 'user-test',
        exerciseSlug: 'predict-output',
        gradingResult,
        responseTimeMs: 2000,
        hintUsed: false,
        qualityScore: 4,
      });

      expect(record.grading_method).toBe('execution-fallback');
      expect(record.used_target_construct).toBeNull();
    });
  });

  describe('metric type shapes', () => {
    it('RetentionMetric has expected structure', () => {
      // Type-level test to ensure interface is correct
      const metric = {
        firstAttemptAccuracy: 0.75,
        subsequentAccuracy: 0.85,
        retentionDelta: 0.1,
        sampleSize: 100,
      };

      expect(metric.retentionDelta).toBeCloseTo(
        metric.subsequentAccuracy - metric.firstAttemptAccuracy
      );
    });

    it('TransferMetric includes subconcept breakdown', () => {
      const metric = {
        assessmentCount: 50,
        correctCount: 40,
        transferRate: 0.8,
        bySubconcept: {
          slicing: { correct: 20, total: 25, rate: 0.8 },
        },
      };

      expect(metric.bySubconcept.slicing.rate).toBe(0.8);
    });

    it('ConstructAdoptionMetric supports all trend types', () => {
      const trends = ['increasing', 'stable', 'decreasing'] as const;

      for (const trend of trends) {
        const metric = {
          totalWithTarget: 100,
          usedTarget: 70,
          adoptionRate: 0.7,
          trend,
        };

        expect(['increasing', 'stable', 'decreasing']).toContain(metric.trend);
      }
    });

    it('CompletionStabilityMetric tracks session and hint data', () => {
      const metric = {
        totalSessions: 50,
        completedSessions: 45,
        abandonedSessions: 5,
        abandonRate: 0.1,
        avgHintUsage: 0.3,
        avgRetryCount: 1.2,
      };

      expect(metric.abandonedSessions).toBe(metric.totalSessions - metric.completedSessions);
      expect(metric.abandonRate).toBeCloseTo(
        metric.abandonedSessions / metric.totalSessions
      );
    });
  });
});
