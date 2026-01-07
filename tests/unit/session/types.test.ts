// tests/unit/session/types.test.ts
import { describe, it, expect } from 'vitest';
import type {
  SessionStats,
  TeachingSessionCard,
  PracticeSessionCard,
  ReviewSessionCard,
  SessionCardType,
} from '@/lib/session';
import { createMockExercise } from '@tests/fixtures/exercise';

describe('session types', () => {
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

  describe('TeachingSessionCard', () => {
    it('has type teaching with teaching content and example exercise', () => {
      const exercise = createMockExercise({ slug: 'for-loop-intro' });
      const card: TeachingSessionCard = {
        type: 'teaching',
        subconcept: 'for',
        teaching: {
          explanation: 'For loops iterate over sequences.',
          exampleSlug: 'for-loop-intro',
        },
        exampleExercise: exercise,
      };

      expect(card.type).toBe('teaching');
      expect(card.subconcept).toBe('for');
      expect(card.teaching.explanation).toBe('For loops iterate over sequences.');
      expect(card.exampleExercise.slug).toBe('for-loop-intro');
    });
  });

  describe('PracticeSessionCard', () => {
    it('has type practice with exercise and isNew flag', () => {
      const exercise = createMockExercise({ slug: 'for-loop-practice' });
      const card: PracticeSessionCard = {
        type: 'practice',
        exercise,
        isNew: true,
      };

      expect(card.type).toBe('practice');
      expect(card.exercise.slug).toBe('for-loop-practice');
      expect(card.isNew).toBe(true);
    });
  });

  describe('ReviewSessionCard', () => {
    it('has type review with exercise', () => {
      const exercise = createMockExercise({ slug: 'for-loop-review' });
      const card: ReviewSessionCard = {
        type: 'review',
        exercise,
      };

      expect(card.type).toBe('review');
      expect(card.exercise.slug).toBe('for-loop-review');
    });
  });

  describe('SessionCardType discriminated union', () => {
    it('can narrow type based on type field', () => {
      const exercise = createMockExercise();
      const cards: SessionCardType[] = [
        {
          type: 'teaching',
          subconcept: 'for',
          teaching: { explanation: 'test', exampleSlug: 'test' },
          exampleExercise: exercise,
        },
        { type: 'practice', exercise, isNew: true },
        { type: 'review', exercise },
      ];

      const teachingCards = cards.filter(
        (c): c is TeachingSessionCard => c.type === 'teaching'
      );
      const practiceCards = cards.filter(
        (c): c is PracticeSessionCard => c.type === 'practice'
      );
      const reviewCards = cards.filter(
        (c): c is ReviewSessionCard => c.type === 'review'
      );

      expect(teachingCards).toHaveLength(1);
      expect(practiceCards).toHaveLength(1);
      expect(reviewCards).toHaveLength(1);
    });
  });
});
