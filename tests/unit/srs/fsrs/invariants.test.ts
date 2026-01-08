// tests/unit/srs/fsrs/invariants.test.ts
// Property-based tests - invariants that must ALWAYS hold
//
// WHY THESE TESTS MATTER:
// - These test fundamental guarantees of the FSRS system
// - If any of these fail, there's a serious bug
// - Unlike regression tests, these don't pin specific values
// - They verify relationships that must always be true

import { describe, it, expect } from 'vitest';
import { createEmptyFSRSCard, reviewCard } from '@/lib/srs/fsrs/adapter';
import type { FSRSRating } from '@/lib/srs/fsrs/types';

// Deterministic random for reproducibility
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function randomRating(random: () => number): FSRSRating {
  const ratings: FSRSRating[] = ['Again', 'Hard', 'Good', 'Easy'];
  return ratings[Math.floor(random() * ratings.length)];
}

function randomPassingRating(random: () => number): FSRSRating {
  const ratings: FSRSRating[] = ['Hard', 'Good', 'Easy'];
  return ratings[Math.floor(random() * ratings.length)];
}

describe('FSRS Invariants - Must Always Hold', () => {
  describe('Stability Properties', () => {
    it('INVARIANT: stability is never negative after any review sequence', () => {
      const NUM_TRIALS = 50;
      const MAX_REVIEWS = 20;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        const random = seededRandom(trial * 12345);
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');

        for (let i = 0; i < MAX_REVIEWS; i++) {
          const rating = randomRating(random);
          const result = reviewCard(card, rating, currentTime);

          expect(result.cardState.stability).toBeGreaterThanOrEqual(0);

          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }
      }
    });

    it('INVARIANT: stability increases on Easy rating (same card state)', () => {
      const NUM_TRIALS = 20;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        // Create a card in various states
        const random = seededRandom(trial * 54321);
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');

        // Advance to some state
        const numReviews = Math.floor(random() * 10) + 1;
        for (let i = 0; i < numReviews; i++) {
          const result = reviewCard(card, 'Good', currentTime);
          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }

        // Compare Good vs Easy on same card
        const goodResult = reviewCard(card, 'Good', currentTime);
        const easyResult = reviewCard(card, 'Easy', currentTime);

        expect(easyResult.cardState.stability).toBeGreaterThanOrEqual(
          goodResult.cardState.stability
        );
      }
    });
  });

  describe('Reps Counter Properties', () => {
    it('INVARIANT: reps always increases by exactly 1 per review', () => {
      const NUM_TRIALS = 50;
      const MAX_REVIEWS = 20;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        const random = seededRandom(trial * 11111);
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');

        for (let i = 0; i < MAX_REVIEWS; i++) {
          const repsBefore = card.reps;
          const rating = randomRating(random);
          const result = reviewCard(card, rating, currentTime);

          expect(result.cardState.reps).toBe(repsBefore + 1);

          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }
      }
    });

    it('INVARIANT: reps is never negative', () => {
      const card = createEmptyFSRSCard(new Date());
      expect(card.reps).toBeGreaterThanOrEqual(0);

      const result = reviewCard(card, 'Again', new Date());
      expect(result.cardState.reps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Lapse Properties', () => {
    it('INVARIANT: lapses only increment on Again from Review state', () => {
      const NUM_TRIALS = 30;
      const MAX_REVIEWS = 15;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        const random = seededRandom(trial * 22222);
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');

        for (let i = 0; i < MAX_REVIEWS; i++) {
          const lapsesBefore = card.lapses;
          const stateBefore = card.state;
          const rating = randomRating(random);
          const result = reviewCard(card, rating, currentTime);

          if (rating === 'Again' && stateBefore === 'Review') {
            // Lapse should increment
            expect(result.cardState.lapses).toBe(lapsesBefore + 1);
          } else {
            // Lapses should not change
            expect(result.cardState.lapses).toBe(lapsesBefore);
          }

          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }
      }
    });

    it('INVARIANT: lapses never decreases', () => {
      const NUM_TRIALS = 30;
      const MAX_REVIEWS = 20;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        const random = seededRandom(trial * 33333);
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');
        let maxLapsesSeen = 0;

        for (let i = 0; i < MAX_REVIEWS; i++) {
          const rating = randomRating(random);
          const result = reviewCard(card, rating, currentTime);

          expect(result.cardState.lapses).toBeGreaterThanOrEqual(maxLapsesSeen);
          maxLapsesSeen = result.cardState.lapses;

          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }
      }
    });
  });

  describe('Due Date Properties', () => {
    it('INVARIANT: due date is set after each review', () => {
      const NUM_TRIALS = 30;
      const MAX_REVIEWS = 15;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        const random = seededRandom(trial * 44444);
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');

        for (let i = 0; i < MAX_REVIEWS; i++) {
          const rating = randomRating(random);
          const result = reviewCard(card, rating, currentTime);

          expect(result.cardState.due).toBeInstanceOf(Date);
          expect(Number.isNaN(result.cardState.due.getTime())).toBe(false);

          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }
      }
    });

    it('INVARIANT: scheduledDays is non-negative in Review state', () => {
      // Get a card into Review state
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let currentTime = new Date('2026-01-01');

      while (card.state !== 'Review') {
        const result = reviewCard(card, 'Good', currentTime);
        card = result.cardState;
        currentTime = new Date(card.due.getTime() + 1000);
      }

      // Do many reviews in Review state
      for (let i = 0; i < 20; i++) {
        const ratings: FSRSRating[] = ['Hard', 'Good', 'Easy'];
        const rating = ratings[i % 3];
        const result = reviewCard(card, rating, currentTime);

        if (result.cardState.state === 'Review') {
          expect(result.cardState.scheduledDays).toBeGreaterThan(0);
        }

        card = result.cardState;
        currentTime = new Date(card.due.getTime() + 1000);
      }
    });
  });

  describe('State Transition Properties', () => {
    it('INVARIANT: New state only exists before first review', () => {
      const card = createEmptyFSRSCard(new Date());
      expect(card.state).toBe('New');
      expect(card.reps).toBe(0);

      const result = reviewCard(card, 'Good', new Date());
      expect(result.cardState.state).not.toBe('New');
    });

    it('INVARIANT: Review state only reached via Learning', () => {
      // A card must pass through Learning to reach Review
      const NUM_TRIALS = 20;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');
        let sawLearning = false;

        while (card.state !== 'Review') {
          if (card.state === 'Learning') {
            sawLearning = true;
          }
          const result = reviewCard(card, 'Good', currentTime);
          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);

          // Safety limit
          if (card.reps > 20) break;
        }

        expect(sawLearning).toBe(true);
      }
    });

    it('INVARIANT: Again in Review always leads to Relearning', () => {
      // Get to Review state
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let currentTime = new Date('2026-01-01');

      while (card.state !== 'Review') {
        const result = reviewCard(card, 'Good', currentTime);
        card = result.cardState;
        currentTime = new Date(card.due.getTime() + 1000);
      }

      // Multiple times: from Review, Again should go to Relearning
      for (let i = 0; i < 5; i++) {
        // Make sure we're in Review state
        while (card.state !== 'Review') {
          const result = reviewCard(card, 'Good', currentTime);
          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }

        const result = reviewCard(card, 'Again', currentTime);
        expect(result.cardState.state).toBe('Relearning');

        card = result.cardState;
        currentTime = new Date(card.due.getTime() + 1000);
      }
    });
  });

  describe('Correctness Properties', () => {
    it('INVARIANT: wasCorrect is false only for Again rating', () => {
      const ratings: FSRSRating[] = ['Again', 'Hard', 'Good', 'Easy'];

      for (const rating of ratings) {
        const card = createEmptyFSRSCard(new Date());
        const result = reviewCard(card, rating, new Date());

        if (rating === 'Again') {
          expect(result.wasCorrect).toBe(false);
        } else {
          expect(result.wasCorrect).toBe(true);
        }
      }
    });
  });

  describe('Consistency Properties', () => {
    it('INVARIANT: same input produces same output (deterministic)', () => {
      const fixedDate = new Date('2026-01-15T10:30:00Z');
      const card = createEmptyFSRSCard(fixedDate);

      const result1 = reviewCard(card, 'Good', fixedDate);
      const result2 = reviewCard(card, 'Good', fixedDate);

      expect(result1.cardState.stability).toBe(result2.cardState.stability);
      expect(result1.cardState.difficulty).toBe(result2.cardState.difficulty);
      expect(result1.cardState.due.getTime()).toBe(result2.cardState.due.getTime());
    });

    it('INVARIANT: rating order consistency (Easy >= Good >= Hard)', () => {
      // For same starting state, Easy should give >= stability than Good
      // Good should give >= stability than Hard
      const NUM_TRIALS = 20;

      for (let trial = 0; trial < NUM_TRIALS; trial++) {
        const random = seededRandom(trial * 55555);
        let card = createEmptyFSRSCard(new Date('2026-01-01'));
        let currentTime = new Date('2026-01-01');

        // Advance to some state
        const numReviews = Math.floor(random() * 8) + 1;
        for (let i = 0; i < numReviews; i++) {
          const result = reviewCard(card, randomPassingRating(random), currentTime);
          card = result.cardState;
          currentTime = new Date(card.due.getTime() + 1000);
        }

        const hardResult = reviewCard(card, 'Hard', currentTime);
        const goodResult = reviewCard(card, 'Good', currentTime);
        const easyResult = reviewCard(card, 'Easy', currentTime);

        // Stability ordering
        expect(easyResult.cardState.stability).toBeGreaterThanOrEqual(
          goodResult.cardState.stability
        );
        expect(goodResult.cardState.stability).toBeGreaterThanOrEqual(
          hardResult.cardState.stability
        );
      }
    });
  });
});
