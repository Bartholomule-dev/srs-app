// tests/unit/skill-tree/get-state.test.ts
import { describe, it, expect } from 'vitest';
import { getSubconceptState, MASTERY_THRESHOLD_DAYS } from '@/lib/skill-tree';
import type { SubconceptProgress } from '@/lib/curriculum/types';

describe('getSubconceptState', () => {
  // Helper to create minimal progress record
  const makeProgress = (stability: number): SubconceptProgress => ({
    id: 'test-id',
    userId: 'user-1',
    subconceptSlug: 'test-subconcept',
    conceptSlug: 'foundations',
    stability,
    difficulty: 5,
    fsrsState: 2,
    reps: 1,
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
      progressMap.set('variables', makeProgress(1)); // Not mastered (stability < 7)

      const result = getSubconceptState(
        'operators', // requires 'variables'
        progressMap,
        ['variables'] // prereqs
      );

      expect(result).toBe('locked');
    });

    it('returns locked when some prerequisites are missing', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('prereq1', makeProgress(10)); // Mastered
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

    it('returns available when all prereqs mastered but no own progress', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(10)); // Mastered

      const result = getSubconceptState(
        'operators',
        progressMap,
        ['variables']
      );

      expect(result).toBe('available');
    });
  });

  describe('in-progress state', () => {
    it('returns in-progress when has progress but stability < threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(3)); // Started but not mastered

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });

    it('returns in-progress at stability boundary minus epsilon', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_THRESHOLD_DAYS - 0.1));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });
  });

  describe('mastered state', () => {
    it('returns mastered when stability >= threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_THRESHOLD_DAYS));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('mastered');
    });

    it('returns mastered when stability > threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(30));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('mastered');
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
