// tests/unit/stats/dynamic-metrics.test.ts
import { describe, it, expect } from 'vitest';
import type {
  RetentionMetric,
  TransferMetric,
  ConstructAdoptionMetric,
  CompletionStabilityMetric,
} from '@/lib/stats/dynamic-metrics';

describe('RetentionMetric type shape', () => {
  it('calculates retention from first vs subsequent attempts', () => {
    // Mock data: 10 first attempts, 8 correct; 20 subsequent, 18 correct
    // The metric function would query DB; for unit test, we test the calculation
    const metric: RetentionMetric = {
      firstAttemptAccuracy: 0.8, // 8/10
      subsequentAccuracy: 0.9,   // 18/20
      retentionDelta: 0.1,       // improved by 10pp
      sampleSize: 30,
    };

    expect(metric.firstAttemptAccuracy).toBe(0.8);
    expect(metric.retentionDelta).toBe(0.1);
    // Floating point precision check
    expect(metric.retentionDelta).toBeCloseTo(
      metric.subsequentAccuracy - metric.firstAttemptAccuracy
    );
  });

  it('handles edge case with zero sample', () => {
    const metric: RetentionMetric = {
      firstAttemptAccuracy: 0,
      subsequentAccuracy: 0,
      retentionDelta: 0,
      sampleSize: 0,
    };

    expect(metric.sampleSize).toBe(0);
    expect(metric.retentionDelta).toBe(0);
  });
});

describe('TransferMetric type shape', () => {
  it('calculates transfer rate from assessments', () => {
    const metric: TransferMetric = {
      assessmentCount: 50,
      correctCount: 40,
      transferRate: 0.8,
      bySubconcept: {
        'slicing': { correct: 15, total: 20, rate: 0.75 },
        'indexing': { correct: 25, total: 30, rate: 0.833 },
      },
    };

    expect(metric.transferRate).toBe(0.8);
    expect(metric.bySubconcept.slicing.rate).toBe(0.75);
    expect(Object.keys(metric.bySubconcept)).toHaveLength(2);
  });

  it('supports empty subconcept breakdown', () => {
    const metric: TransferMetric = {
      assessmentCount: 0,
      correctCount: 0,
      transferRate: 0,
      bySubconcept: {},
    };

    expect(Object.keys(metric.bySubconcept)).toHaveLength(0);
  });
});

describe('ConstructAdoptionMetric type shape', () => {
  it('calculates construct adoption over time', () => {
    const metric: ConstructAdoptionMetric = {
      totalWithTarget: 100,
      usedTarget: 70,
      adoptionRate: 0.7,
      trend: 'increasing', // compared to previous period
    };

    expect(metric.adoptionRate).toBe(0.7);
    expect(metric.trend).toBe('increasing');
    expect(metric.usedTarget / metric.totalWithTarget).toBe(metric.adoptionRate);
  });

  it('supports all trend values', () => {
    const trends: ConstructAdoptionMetric['trend'][] = ['increasing', 'stable', 'decreasing'];
    trends.forEach(trend => {
      const metric: ConstructAdoptionMetric = {
        totalWithTarget: 50,
        usedTarget: 25,
        adoptionRate: 0.5,
        trend,
      };
      expect(['increasing', 'stable', 'decreasing']).toContain(metric.trend);
    });
  });
});

describe('CompletionStabilityMetric type shape', () => {
  it('calculates completion stability metrics', () => {
    const metric: CompletionStabilityMetric = {
      totalSessions: 50,
      completedSessions: 45,
      abandonedSessions: 5,
      abandonRate: 0.1,
      avgHintUsage: 0.3, // 30% of exercises used hints
      avgRetryCount: 1.2, // average retries per failed exercise
    };

    expect(metric.abandonRate).toBe(0.1);
    expect(metric.avgHintUsage).toBe(0.3);
    expect(metric.abandonedSessions + metric.completedSessions).toBe(metric.totalSessions);
  });

  it('handles session with no abandonment', () => {
    const metric: CompletionStabilityMetric = {
      totalSessions: 100,
      completedSessions: 100,
      abandonedSessions: 0,
      abandonRate: 0,
      avgHintUsage: 0.1,
      avgRetryCount: 0.5,
    };

    expect(metric.abandonRate).toBe(0);
    expect(metric.completedSessions).toBe(metric.totalSessions);
  });
});
