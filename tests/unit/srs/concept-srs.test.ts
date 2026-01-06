// tests/unit/srs/concept-srs.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getDueSubconcepts,
  selectExercise,
  calculateSubconceptReview,
  createInitialSubconceptState,
} from '@/lib/srs/concept-algorithm';
import type { SubconceptProgress, ExerciseAttempt } from '@/lib/curriculum/types';
import type { Exercise } from '@/lib/types';

describe('Concept-Based SRS', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDueSubconcepts', () => {
    it('returns subconcepts where next_review <= now', () => {
      const now = new Date();
      const progress: SubconceptProgress[] = [
        {
          id: '1',
          userId: 'user-1',
          subconceptSlug: 'for',
          conceptSlug: 'control-flow',
          nextReview: new Date(now.getTime() - 1000),
          phase: 'review',
          easeFactor: 2.5,
          interval: 6,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 'user-1',
          subconceptSlug: 'while',
          conceptSlug: 'control-flow',
          nextReview: new Date(now.getTime() + 86400000),
          phase: 'review',
          easeFactor: 2.5,
          interval: 6,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          userId: 'user-1',
          subconceptSlug: 'range',
          conceptSlug: 'control-flow',
          nextReview: now,
          phase: 'learning',
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const due = getDueSubconcepts(progress);

      expect(due).toHaveLength(2);
      expect(due.map((d) => d.subconceptSlug)).toContain('for');
      expect(due.map((d) => d.subconceptSlug)).toContain('range');
    });

    it('sorts by most overdue first', () => {
      const now = new Date();
      const progress: SubconceptProgress[] = [
        {
          id: '1',
          userId: 'user-1',
          subconceptSlug: 'a',
          conceptSlug: 'control-flow',
          nextReview: new Date(now.getTime() - 1000),
          phase: 'review',
          easeFactor: 2.5,
          interval: 6,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 'user-1',
          subconceptSlug: 'b',
          conceptSlug: 'control-flow',
          nextReview: new Date(now.getTime() - 5000),
          phase: 'review',
          easeFactor: 2.5,
          interval: 6,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const due = getDueSubconcepts(progress);

      expect(due[0].subconceptSlug).toBe('b'); // More overdue
    });

    it('returns empty array when no subconcepts are due', () => {
      const now = new Date();
      const progress: SubconceptProgress[] = [
        {
          id: '1',
          userId: 'user-1',
          subconceptSlug: 'a',
          conceptSlug: 'control-flow',
          nextReview: new Date(now.getTime() + 86400000),
          phase: 'review',
          easeFactor: 2.5,
          interval: 6,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const due = getDueSubconcepts(progress);

      expect(due).toHaveLength(0);
    });
  });

  describe('selectExercise', () => {
    const createMockExercise = (
      slug: string,
      subconcept: string,
      level: 'intro' | 'practice' | 'edge' | 'integrated'
    ): Exercise => ({
      id: slug,
      slug,
      language: 'python',
      category: 'control-flow',
      difficulty: 1,
      title: `Exercise ${slug}`,
      prompt: 'Test prompt',
      expectedAnswer: 'test answer',
      acceptedSolutions: [],
      hints: [],
      explanation: null,
      tags: [],
      timesPracticed: 0,
      avgSuccessRate: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      concept: 'control-flow',
      subconcept,
      level,
      prereqs: [],
      exerciseType: 'write',
      pattern: 'iteration',
      template: null,
      blankPosition: null,
      objective: '',
      targets: null,
    });

    const exercises: Exercise[] = [
      createMockExercise('for-intro-1', 'for', 'intro'),
      createMockExercise('for-intro-2', 'for', 'intro'),
      createMockExercise('for-practice-1', 'for', 'practice'),
      createMockExercise('for-edge-1', 'for', 'edge'),
    ];

    it('returns intro exercises first when phase is learning', () => {
      const progress: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        phase: 'learning',
        easeFactor: 2.5,
        interval: 0,
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const attempts: ExerciseAttempt[] = [];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.level).toBe('intro');
    });

    it('returns unseen intro exercise before seen intro', () => {
      const progress: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        phase: 'learning',
        easeFactor: 2.5,
        interval: 0,
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const attempts: ExerciseAttempt[] = [
        {
          id: '1',
          userId: 'user-1',
          exerciseSlug: 'for-intro-1',
          timesSeen: 2,
          timesCorrect: 1,
          lastSeenAt: new Date(),
        },
      ];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.slug).toBe('for-intro-2');
    });

    it('progresses to practice after all intro seen', () => {
      const progress: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        phase: 'learning',
        easeFactor: 2.5,
        interval: 0,
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const attempts: ExerciseAttempt[] = [
        {
          id: '1',
          userId: 'user-1',
          exerciseSlug: 'for-intro-1',
          timesSeen: 1,
          timesCorrect: 1,
          lastSeenAt: new Date(),
        },
        {
          id: '2',
          userId: 'user-1',
          exerciseSlug: 'for-intro-2',
          timesSeen: 1,
          timesCorrect: 1,
          lastSeenAt: new Date(),
        },
      ];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.level).toBe('practice');
    });

    it('returns least-seen exercise when phase is review', () => {
      const progress: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        phase: 'review',
        easeFactor: 2.5,
        interval: 6,
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // All exercises have been seen, for-edge-1 has the lowest timesSeen
      const attempts: ExerciseAttempt[] = [
        {
          id: '1',
          userId: 'user-1',
          exerciseSlug: 'for-intro-1',
          timesSeen: 5,
          timesCorrect: 4,
          lastSeenAt: new Date(),
        },
        {
          id: '2',
          userId: 'user-1',
          exerciseSlug: 'for-intro-2',
          timesSeen: 4,
          timesCorrect: 3,
          lastSeenAt: new Date(),
        },
        {
          id: '3',
          userId: 'user-1',
          exerciseSlug: 'for-practice-1',
          timesSeen: 2,
          timesCorrect: 1,
          lastSeenAt: new Date(),
        },
        {
          id: '4',
          userId: 'user-1',
          exerciseSlug: 'for-edge-1',
          timesSeen: 1,
          timesCorrect: 1,
          lastSeenAt: new Date(),
        },
      ];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.slug).toBe('for-edge-1');
    });

    it('returns null when no exercises match the subconcept', () => {
      const progress: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'while',
        conceptSlug: 'control-flow',
        phase: 'learning',
        easeFactor: 2.5,
        interval: 0,
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const attempts: ExerciseAttempt[] = [];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise).toBeNull();
    });

    it('prefers unseen exercises in review phase', () => {
      const progress: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        phase: 'review',
        easeFactor: 2.5,
        interval: 6,
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Only for-intro-1 has been seen
      const attempts: ExerciseAttempt[] = [
        {
          id: '1',
          userId: 'user-1',
          exerciseSlug: 'for-intro-1',
          timesSeen: 5,
          timesCorrect: 4,
          lastSeenAt: new Date(),
        },
      ];

      const exercise = selectExercise(progress, exercises, attempts);

      // Should return one of the unseen exercises (timesSeen = 0)
      expect(exercise?.slug).not.toBe('for-intro-1');
    });
  });

  describe('calculateSubconceptReview', () => {
    it('updates SRS state based on quality', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 2.5,
        interval: 1,
        phase: 'learning',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(4, state); // Quality 4 = Good

      expect(result.easeFactor).toBeCloseTo(2.5, 1);
      expect(result.interval).toBeGreaterThan(1);
    });

    it('transitions to review phase after graduating interval', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 2.5,
        interval: 6, // Graduating interval
        phase: 'learning',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(4, state);

      expect(result.phase).toBe('review');
    });

    it('resets to learning phase on quality < 3', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 2.5,
        interval: 10,
        phase: 'review',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(2, state); // Quality 2 = Failed

      expect(result.phase).toBe('learning');
      expect(result.interval).toBe(1);
    });

    it('increases ease factor on quality 5 (easy)', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 2.5,
        interval: 6,
        phase: 'review',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(5, state);

      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('decreases ease factor on quality 3 (hard)', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 2.5,
        interval: 6,
        phase: 'review',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(3, state);

      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('never drops ease factor below minimum (1.3)', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 1.3,
        interval: 1,
        phase: 'learning',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(3, state);

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('never exceeds ease factor maximum (3.0)', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 3.0,
        interval: 10,
        phase: 'review',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(5, state);

      expect(result.easeFactor).toBeLessThanOrEqual(3.0);
    });

    it('sets nextReview based on new interval', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 2.5,
        interval: 6,
        phase: 'review',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(4, state);

      // Next review should be interval days from now
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + result.interval);
      expect(result.nextReview.getDate()).toBe(expectedDate.getDate());
    });

    it('updates lastReviewed to current time', () => {
      const state: SubconceptProgress = {
        id: '1',
        userId: 'user-1',
        subconceptSlug: 'for',
        conceptSlug: 'control-flow',
        easeFactor: 2.5,
        interval: 1,
        phase: 'learning',
        nextReview: new Date(),
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateSubconceptReview(4, state);

      expect(result.lastReviewed).not.toBeNull();
    });
  });

  describe('createInitialSubconceptState', () => {
    it('creates state with default values', () => {
      const state = createInitialSubconceptState('for', 'control-flow', 'user-123');

      expect(state.subconceptSlug).toBe('for');
      expect(state.conceptSlug).toBe('control-flow');
      expect(state.userId).toBe('user-123');
      expect(state.phase).toBe('learning');
      expect(state.easeFactor).toBe(2.5);
      expect(state.interval).toBe(0);
    });

    it('sets nextReview to current time', () => {
      const before = new Date();
      const state = createInitialSubconceptState('for', 'control-flow', 'user-123');
      const after = new Date();

      expect(state.nextReview.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(state.nextReview.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('sets lastReviewed to null', () => {
      const state = createInitialSubconceptState('for', 'control-flow', 'user-123');

      expect(state.lastReviewed).toBeNull();
    });

    it('generates a unique id', () => {
      const state1 = createInitialSubconceptState('for', 'control-flow', 'user-123');
      const state2 = createInitialSubconceptState('for', 'control-flow', 'user-123');

      expect(state1.id).toBeDefined();
      expect(state1.id).not.toBe(state2.id);
    });
  });
});
