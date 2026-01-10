import { describe, it, expect } from 'vitest';
import {
  findConceptBoundaries,
  interleaveAtBoundaries,
} from '@/lib/session/interleave-teaching';
import type { ReviewSessionCard } from '@/lib/session/types';
import type { TeachingPair } from '@/lib/session/teaching-cards';
import type { ConceptSlug } from '@/lib/curriculum/types';
import { createMockExercise } from '@tests/fixtures/exercise';

function createReviewCard(id: string, concept: ConceptSlug): ReviewSessionCard {
  return {
    type: 'review',
    exercise: createMockExercise({ id, slug: `review-${id}`, concept }),
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

describe('findConceptBoundaries', () => {
  it('returns empty array for empty input', () => {
    const result = findConceptBoundaries([]);
    expect(result).toEqual([]);
  });

  it('returns empty array when all cards are same concept', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'loops'),
      createReviewCard('3', 'loops'),
    ];

    const result = findConceptBoundaries(reviewCards);
    expect(result).toEqual([]);
  });

  it('returns index where concept changes', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'loops'),
      createReviewCard('3', 'conditionals'),
    ];

    const result = findConceptBoundaries(reviewCards);
    expect(result).toEqual([2]);
  });

  it('returns multiple boundaries for multiple concept changes', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'conditionals'),
      createReviewCard('3', 'functions'),
    ];

    const result = findConceptBoundaries(reviewCards);
    expect(result).toEqual([1, 2]);
  });

  it('handles single card (no boundaries)', () => {
    const reviewCards = [createReviewCard('1', 'loops')];

    const result = findConceptBoundaries(reviewCards);
    expect(result).toEqual([]);
  });
});

describe('interleaveAtBoundaries', () => {
  it('returns empty array when both inputs empty', () => {
    const result = interleaveAtBoundaries([], []);
    expect(result).toEqual([]);
  });

  it('returns only review cards when no teaching pairs', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'conditionals'),
    ];

    const result = interleaveAtBoundaries(reviewCards, []);

    expect(result).toHaveLength(2);
    expect(result.every(c => c.type === 'review')).toBe(true);
  });

  it('returns teaching pairs when no review cards', () => {
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries([], pairs);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('teaching');
    expect(result[1].type).toBe('practice');
  });

  it('inserts teaching pair at concept boundary', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'loops'),
      createReviewCard('3', 'conditionals'),
      createReviewCard('4', 'conditionals'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // 4 reviews + 1 pair (2 cards) = 6 total
    expect(result).toHaveLength(6);

    // Teaching should be inserted at boundary (index 2)
    expect(result[0].type).toBe('review'); // loops 1
    expect(result[1].type).toBe('review'); // loops 2
    expect(result[2].type).toBe('teaching'); // teaching inserted before boundary
    expect(result[3].type).toBe('practice');
    expect(result[4].type).toBe('review'); // conditionals 3
    expect(result[5].type).toBe('review'); // conditionals 4
  });

  it('prepends teaching when no boundaries exist', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'loops'),
      createReviewCard('3', 'loops'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // 3 reviews + 1 pair (2 cards) = 5 total
    expect(result).toHaveLength(5);

    // Teaching should be prepended at start
    expect(result[0].type).toBe('teaching');
    expect(result[1].type).toBe('practice');
    expect(result[2].type).toBe('review');
    expect(result[3].type).toBe('review');
    expect(result[4].type).toBe('review');
  });

  it('distributes multiple teaching pairs across boundaries', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'conditionals'),
      createReviewCard('3', 'functions'),
    ];
    const pairs = [createTeachingPair('for'), createTeachingPair('while')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // 3 reviews + 2 pairs (4 cards) = 7 total
    expect(result).toHaveLength(7);

    // First boundary at index 1, second at index 2
    expect(result[0].type).toBe('review'); // loops
    expect(result[1].type).toBe('teaching'); // for teaching at boundary 1
    expect(result[2].type).toBe('practice');
    expect(result[3].type).toBe('review'); // conditionals
    expect(result[4].type).toBe('teaching'); // while teaching at boundary 2
    expect(result[5].type).toBe('practice');
    expect(result[6].type).toBe('review'); // functions
  });

  it('prepends extra teaching pairs when more pairs than boundaries', () => {
    const reviewCards = [
      createReviewCard('1', 'loops'),
      createReviewCard('2', 'conditionals'),
    ];
    const pairs = [
      createTeachingPair('for'),
      createTeachingPair('while'),
      createTeachingPair('if'),
    ];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // 2 reviews + 3 pairs (6 cards) = 8 total
    expect(result).toHaveLength(8);

    // 1 boundary at index 1, so 2 extra pairs prepended
    expect(result[0].type).toBe('teaching'); // extra pair 1
    expect(result[1].type).toBe('practice');
    expect(result[2].type).toBe('teaching'); // extra pair 2
    expect(result[3].type).toBe('practice');
    expect(result[4].type).toBe('review'); // loops
    expect(result[5].type).toBe('teaching'); // pair at boundary
    expect(result[6].type).toBe('practice');
    expect(result[7].type).toBe('review'); // conditionals
  });

  it('preserves order of review cards', () => {
    const reviewCards = [
      createReviewCard('a', 'loops'),
      createReviewCard('b', 'conditionals'),
      createReviewCard('c', 'functions'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    const reviewOnly = result.filter((c): c is ReviewSessionCard => c.type === 'review');
    expect(reviewOnly.map(c => c.exercise.id)).toEqual(['a', 'b', 'c']);
  });
});
