import { describe, it, expect } from 'vitest';
import { buildTeachingPair, findExampleExercise } from '@/lib/session/teaching-cards';
import { createMockExercise } from '@tests/fixtures/exercise';
import type { SubconceptDefinition } from '@/lib/curriculum/types';

describe('Teaching Cards', () => {
  const mockSubconcept: SubconceptDefinition = {
    name: 'For Loops',
    concept: 'control-flow',
    prereqs: ['lists'],
    teaching: {
      explanation: 'For loops iterate over sequences.',
      exampleSlug: 'for-loop-range-intro',
    },
  };

  describe('findExampleExercise', () => {
    it('finds exercise matching the exampleSlug', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for' }),
        createMockExercise({ slug: 'for-loop-practice', subconcept: 'for' }),
      ];

      const example = findExampleExercise('for-loop-range-intro', exercises);

      expect(example).not.toBeNull();
      expect(example?.slug).toBe('for-loop-range-intro');
    });

    it('returns null if exampleSlug not found', () => {
      const exercises = [
        createMockExercise({ slug: 'other-exercise', subconcept: 'for' }),
      ];

      const example = findExampleExercise('for-loop-range-intro', exercises);

      expect(example).toBeNull();
    });
  });

  describe('buildTeachingPair', () => {
    it('returns teaching card and practice card for new subconcept', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for', level: 'intro' }),
        createMockExercise({ slug: 'for-loop-practice', subconcept: 'for', level: 'practice' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).not.toBeNull();
      expect(pair?.teachingCard.type).toBe('teaching');
      expect(pair?.teachingCard.subconcept).toBe('for');
      expect(pair?.teachingCard.teaching.explanation).toBe('For loops iterate over sequences.');
      expect(pair?.teachingCard.exampleExercise.slug).toBe('for-loop-range-intro');

      expect(pair?.practiceCard.type).toBe('practice');
      expect(pair?.practiceCard.exercise.slug).toBe('for-loop-practice');
      expect(pair?.practiceCard.isNew).toBe(true);
    });

    it('selects different exercise for practice than example', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for', level: 'intro' }),
        createMockExercise({ slug: 'for-loop-basic', subconcept: 'for', level: 'intro' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).not.toBeNull();
      expect(pair?.teachingCard.exampleExercise.slug).toBe('for-loop-range-intro');
      expect(pair?.practiceCard.exercise.slug).toBe('for-loop-basic');
    });

    it('returns null if example exercise not found', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-practice', subconcept: 'for' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).toBeNull();
    });

    it('returns null if no practice exercise available', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).toBeNull();
    });
  });
});
