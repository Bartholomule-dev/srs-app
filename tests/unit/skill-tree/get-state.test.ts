// tests/unit/skill-tree/get-state.test.ts
import { describe, it, expect } from 'vitest';
import {
  getSubconceptState,
  MASTERY_STABILITY_FAST,
  MASTERY_STABILITY_STANDARD,
  MASTERY_REPS,
  PROFICIENT_STABILITY,
  PROFICIENT_REPS,
} from '@/lib/skill-tree';
import type { SubconceptProgress } from '@/lib/curriculum/types';

describe('getSubconceptState', () => {
  // Helper to create minimal progress record
  const makeProgress = (stability: number, reps = 1): SubconceptProgress => ({
    id: 'test-id',
    userId: 'user-1',
    subconceptSlug: 'test-subconcept',
    conceptSlug: 'foundations',
    language: 'python',
    stability,
    difficulty: 5,
    fsrsState: 2,
    reps,
    lapses: 0,
    elapsedDays: 0,
    scheduledDays: 1,
    nextReview: new Date(),
    lastReviewed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('locked state', () => {
    it('returns locked when prerequisites are not mastered', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(5)); // Not mastered (stability < 14 or stability < 21)

      const result = getSubconceptState(
        'operators', // requires 'variables'
        progressMap,
        ['variables'] // prereqs
      );

      expect(result).toBe('locked');
    });

    it('returns locked when some prerequisites are missing', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('prereq1', makeProgress(MASTERY_STABILITY_FAST)); // Mastered via fast-track
      // prereq2 is missing entirely

      const result = getSubconceptState(
        'test-subconcept',
        progressMap,
        ['prereq1', 'prereq2']
      );

      expect(result).toBe('locked');
    });
  });

  describe('available state', () => {
    it('returns available when no prereqs and no progress', () => {
      const progressMap = new Map<string, SubconceptProgress>();

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('available');
    });

    it('returns available when all prereqs mastered (fast-track) but no own progress', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_STABILITY_FAST)); // Mastered via fast-track

      const result = getSubconceptState(
        'operators',
        progressMap,
        ['variables']
      );

      expect(result).toBe('available');
    });

    it('returns available when all prereqs mastered (standard) but no own progress', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_STABILITY_STANDARD, MASTERY_REPS)); // Mastered via standard

      const result = getSubconceptState(
        'operators',
        progressMap,
        ['variables']
      );

      expect(result).toBe('available');
    });
  });

  describe('in-progress state', () => {
    it('returns in-progress when has progress but not proficient', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(5)); // Started but not proficient

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });

    it('returns in-progress at proficient boundary minus epsilon', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      // Need stability >= 10 AND reps >= 2 for proficient
      progressMap.set('variables', makeProgress(PROFICIENT_STABILITY - 0.1, PROFICIENT_REPS));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });

    it('returns in-progress when stability is high but reps too low for proficient', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      // stability >= 10 but reps < 2
      progressMap.set('variables', makeProgress(PROFICIENT_STABILITY, PROFICIENT_REPS - 1));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });
  });

  describe('proficient state', () => {
    it('returns proficient when stability >= 10 and reps >= 2 but not mastered', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(PROFICIENT_STABILITY, PROFICIENT_REPS));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('proficient');
    });

    it('returns proficient at exact boundary', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(10, 2)); // Exactly at proficient threshold

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('proficient');
    });

    it('returns proficient when above proficient but below mastered threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      // stability 12, reps 2 - above proficient but below standard mastery
      progressMap.set('variables', makeProgress(12, 2));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('proficient');
    });
  });

  describe('mastered state', () => {
    it('returns mastered with fast-track (stability >= 21)', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_STABILITY_FAST));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('mastered');
    });

    it('returns mastered with standard path (stability >= 14 AND reps >= 3)', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_STABILITY_STANDARD, MASTERY_REPS));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('mastered');
    });

    it('returns mastered when stability far exceeds threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(50));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('mastered');
    });

    it('does NOT return mastered when stability is 14 but reps < 3', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_STABILITY_STANDARD, 2));

      const result = getSubconceptState('variables', progressMap, []);

      // Should be proficient, not mastered
      expect(result).toBe('proficient');
    });
  });

  describe('edge cases', () => {
    it('handles stability of 0', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(0));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });

    it('handles empty prereqs array', () => {
      const progressMap = new Map<string, SubconceptProgress>();

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('available');
    });
  });
});
