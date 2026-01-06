import { describe, it, expect } from 'vitest';
import { interleaveWithTeaching } from '@/lib/session/interleave-teaching';
import type { ReviewSessionCard, TeachingSessionCard } from '@/lib/session/types';
import type { TeachingPair } from '@/lib/session/teaching-cards';
import { createMockExercise } from '@tests/fixtures/exercise';

function createReviewCard(id: string): ReviewSessionCard {
  return {
    type: 'review',
    exercise: createMockExercise({ id, slug: `review-${id}` }),
  };
}

function createTeachingPair(subconcept: string): TeachingPair {
  return {
    teachingCard: {
      type: 'teaching',
      subconcept,
      teaching: { explanation: `Learn ${subconcept}`, exampleSlug: `${subconcept}-intro` },
      exampleExercise: createMockExercise({ slug: `${subconcept}-intro` }),
    },
    practiceCard: {
      type: 'practice',
      exercise: createMockExercise({ slug: `${subconcept}-practice` }),
      isNew: true,
    },
  };
}

describe('interleaveWithTeaching', () => {
  it('returns empty array when both inputs empty', () => {
    const result = interleaveWithTeaching([], []);
    expect(result).toEqual([]);
  });

  it('returns only review cards when no teaching pairs', () => {
    const reviewCards = [createReviewCard('1'), createReviewCard('2')];
    const result = interleaveWithTeaching(reviewCards, []);

    expect(result).toHaveLength(2);
    expect(result.every(c => c.type === 'review')).toBe(true);
  });

  it('returns teaching pairs when no review cards', () => {
    const pairs = [createTeachingPair('for')];
    const result = interleaveWithTeaching([], pairs);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('teaching');
    expect(result[1].type).toBe('practice');
  });

  it('interleaves teaching pairs after every 3 review cards', () => {
    const reviewCards = [
      createReviewCard('1'),
      createReviewCard('2'),
      createReviewCard('3'),
      createReviewCard('4'),
      createReviewCard('5'),
      createReviewCard('6'),
    ];
    const pairs = [createTeachingPair('for'), createTeachingPair('while')];

    const result = interleaveWithTeaching(reviewCards, pairs);

    // 6 reviews + 2 pairs (4 cards) = 10 total
    expect(result).toHaveLength(10);

    // Check pattern: 3 reviews, then teaching pair, then 3 more reviews, then teaching pair
    expect(result[0].type).toBe('review');
    expect(result[1].type).toBe('review');
    expect(result[2].type).toBe('review');
    expect(result[3].type).toBe('teaching');
    expect(result[4].type).toBe('practice');
    expect(result[5].type).toBe('review');
    expect(result[6].type).toBe('review');
    expect(result[7].type).toBe('review');
    expect(result[8].type).toBe('teaching');
    expect(result[9].type).toBe('practice');
  });

  it('keeps teaching and practice cards together as pairs', () => {
    const reviewCards = [createReviewCard('1'), createReviewCard('2')];
    const pairs = [createTeachingPair('for')];

    const result = interleaveWithTeaching(reviewCards, pairs);

    // Find teaching card index
    const teachingIndex = result.findIndex(c => c.type === 'teaching');
    expect(teachingIndex).toBeGreaterThanOrEqual(0);

    // Practice should immediately follow
    expect(result[teachingIndex + 1].type).toBe('practice');

    // They should be for the same subconcept
    const teaching = result[teachingIndex] as TeachingSessionCard;
    expect(teaching.subconcept).toBe('for');
  });

  it('preserves order of review cards', () => {
    const reviewCards = [
      createReviewCard('a'),
      createReviewCard('b'),
      createReviewCard('c'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveWithTeaching(reviewCards, pairs);

    const reviewOnly = result.filter((c): c is ReviewSessionCard => c.type === 'review');
    expect(reviewOnly.map(c => c.exercise.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves order of teaching pairs', () => {
    const reviewCards: ReviewSessionCard[] = [];
    const pairs = [
      createTeachingPair('for'),
      createTeachingPair('while'),
      createTeachingPair('if'),
    ];

    const result = interleaveWithTeaching(reviewCards, pairs);

    const teachingOnly = result.filter((c): c is TeachingSessionCard => c.type === 'teaching');
    expect(teachingOnly.map(c => c.subconcept)).toEqual(['for', 'while', 'if']);
  });

  it('handles fewer reviews than interval with teaching pairs', () => {
    const reviewCards = [createReviewCard('1'), createReviewCard('2')];
    const pairs = [createTeachingPair('for')];

    const result = interleaveWithTeaching(reviewCards, pairs);

    // 2 reviews + 1 pair (2 cards) = 4 total
    expect(result).toHaveLength(4);

    // Reviews first, then teaching pair at the end
    expect(result[0].type).toBe('review');
    expect(result[1].type).toBe('review');
    expect(result[2].type).toBe('teaching');
    expect(result[3].type).toBe('practice');
  });

  it('handles more teaching pairs than intervals', () => {
    const reviewCards = [createReviewCard('1'), createReviewCard('2'), createReviewCard('3')];
    const pairs = [
      createTeachingPair('for'),
      createTeachingPair('while'),
      createTeachingPair('if'),
    ];

    const result = interleaveWithTeaching(reviewCards, pairs);

    // 3 reviews + 3 pairs (6 cards) = 9 total
    expect(result).toHaveLength(9);

    // Check: 3 reviews, pair, pair, pair
    expect(result[0].type).toBe('review');
    expect(result[1].type).toBe('review');
    expect(result[2].type).toBe('review');
    expect(result[3].type).toBe('teaching');
    expect(result[4].type).toBe('practice');
    expect(result[5].type).toBe('teaching');
    expect(result[6].type).toBe('practice');
    expect(result[7].type).toBe('teaching');
    expect(result[8].type).toBe('practice');
  });
});
