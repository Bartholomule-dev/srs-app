// tests/unit/session/types.test.ts
import { describe, it, expect } from 'vitest';
import type { SessionCard, SessionStats } from '@/lib/session';
import { createMockExercise } from '@tests/fixtures/exercise';

describe('session types', () => {
  describe('SessionCard', () => {
    it('has required properties', () => {
      const card: SessionCard = {
        exercise: createMockExercise({
          id: 'ex-1',
          slug: 'print-statement',
          title: 'Print Statement',
          prompt: 'Write a print statement',
          expectedAnswer: 'print("hello")',
          hints: ['Use print()'],
          tags: ['print'],
        }),
        state: {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          nextReview: new Date(),
          lastReviewed: null,
        },
        isNew: true,
      };
      expect(card.exercise.id).toBe('ex-1');
      expect(card.state.easeFactor).toBe(2.5);
      expect(card.isNew).toBe(true);
    });
  });

  describe('SessionStats', () => {
    it('has required properties', () => {
      const stats: SessionStats = {
        total: 10,
        completed: 5,
        correct: 4,
        incorrect: 1,
        startTime: new Date(),
        endTime: undefined,
      };
      expect(stats.total).toBe(10);
      expect(stats.completed).toBe(5);
      expect(stats.correct).toBe(4);
      expect(stats.incorrect).toBe(1);
      expect(stats.startTime).toBeInstanceOf(Date);
      expect(stats.endTime).toBeUndefined();
    });

    it('can have endTime set', () => {
      const stats: SessionStats = {
        total: 10,
        completed: 10,
        correct: 8,
        incorrect: 2,
        startTime: new Date('2026-01-01T10:00:00Z'),
        endTime: new Date('2026-01-01T10:15:00Z'),
      };
      expect(stats.endTime).toBeInstanceOf(Date);
    });
  });
});
