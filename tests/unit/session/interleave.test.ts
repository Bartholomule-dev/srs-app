import { describe, it, expect } from 'vitest';
import { interleaveCards } from '@/lib/session';
import type { SessionCard } from '@/lib/session';
import type { Exercise } from '@/lib/types';
import type { CardState } from '@/lib/srs';

// Helper to create mock SessionCard
function createMockCard(id: string, isNew: boolean): SessionCard {
  const exercise: Exercise = {
    id,
    slug: `exercise-${id}`,
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: `Exercise ${id}`,
    prompt: 'Test prompt',
    expectedAnswer: 'test',
    acceptedSolutions: [],
    hints: [],
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const state: CardState = {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date(),
    lastReviewed: null,
  };
  return { exercise, state, isNew };
}

describe('interleaveCards', () => {
  it('returns empty array when both inputs are empty', () => {
    const result = interleaveCards([], []);
    expect(result).toEqual([]);
  });

  it('returns only due cards when no new cards', () => {
    const dueCards = [createMockCard('d1', false), createMockCard('d2', false)];
    const result = interleaveCards(dueCards, []);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.exercise.id)).toEqual(['d1', 'd2']);
  });

  it('returns only new cards when no due cards', () => {
    const newCards = [createMockCard('n1', true), createMockCard('n2', true)];
    const result = interleaveCards([], newCards);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.exercise.id)).toEqual(['n1', 'n2']);
  });

  it('interleaves one new card after every 2-3 due cards', () => {
    const dueCards = [
      createMockCard('d1', false),
      createMockCard('d2', false),
      createMockCard('d3', false),
      createMockCard('d4', false),
      createMockCard('d5', false),
      createMockCard('d6', false),
    ];
    const newCards = [createMockCard('n1', true), createMockCard('n2', true)];
    const result = interleaveCards(dueCards, newCards);

    // Should have all 8 cards
    expect(result).toHaveLength(8);

    // New cards should not be at the very beginning
    expect(result[0].isNew).toBe(false);
    expect(result[1].isNew).toBe(false);

    // New cards should be spread out, not bunched together
    const newCardIndices = result
      .map((c, i) => (c.isNew ? i : -1))
      .filter((i) => i !== -1);
    expect(newCardIndices).toHaveLength(2);

    // Should have gap of at least 2 between new cards
    if (newCardIndices.length === 2) {
      expect(newCardIndices[1] - newCardIndices[0]).toBeGreaterThanOrEqual(2);
    }
  });

  it('handles more new cards than slots allow', () => {
    const dueCards = [createMockCard('d1', false), createMockCard('d2', false)];
    const newCards = [
      createMockCard('n1', true),
      createMockCard('n2', true),
      createMockCard('n3', true),
      createMockCard('n4', true),
    ];
    const result = interleaveCards(dueCards, newCards);

    // All cards should be included
    expect(result).toHaveLength(6);

    // Check all IDs are present
    const ids = result.map((c) => c.exercise.id);
    expect(ids).toContain('d1');
    expect(ids).toContain('d2');
    expect(ids).toContain('n1');
    expect(ids).toContain('n2');
    expect(ids).toContain('n3');
    expect(ids).toContain('n4');
  });

  it('preserves original order of due cards', () => {
    const dueCards = [
      createMockCard('d1', false),
      createMockCard('d2', false),
      createMockCard('d3', false),
    ];
    const newCards = [createMockCard('n1', true)];
    const result = interleaveCards(dueCards, newCards);

    const dueOnly = result.filter((c) => !c.isNew);
    expect(dueOnly.map((c) => c.exercise.id)).toEqual(['d1', 'd2', 'd3']);
  });

  it('preserves original order of new cards', () => {
    const dueCards = [createMockCard('d1', false)];
    const newCards = [
      createMockCard('n1', true),
      createMockCard('n2', true),
      createMockCard('n3', true),
    ];
    const result = interleaveCards(dueCards, newCards);

    const newOnly = result.filter((c) => c.isNew);
    expect(newOnly.map((c) => c.exercise.id)).toEqual(['n1', 'n2', 'n3']);
  });
});
