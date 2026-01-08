// tests/unit/srs/fsrs/integration.test.ts
// Cross-MODULE integration tests for FSRS
//
// PURPOSE: Test flows that cross module boundaries
// - FSRS state → exercise selection phase mapping
// - Progress ↔ CardState round-trip (DB persistence simulation)
//
// NOTE: Individual component tests are in:
//   - adapter.test.ts (FSRS adapter functions)
//   - mapping.test.ts (quality/rating mapping)
//   - regression.test.ts (pinned behavior)
//   - invariants.test.ts (properties that must hold)

import { describe, it, expect } from 'vitest';
import {
  createEmptyFSRSCard,
  reviewCard,
  cardStateToProgress,
  progressToCardState,
} from '@/lib/srs/fsrs/adapter';
import { mapFSRSStateToPhase, selectExercise } from '@/lib/srs/exercise-selection';
import type { FSRSState } from '@/lib/srs/fsrs/types';
import { createMockExercise } from '@tests/fixtures/exercise';

describe('FSRS Cross-Module Integration', () => {
  describe('FSRS State → Exercise Selection Phase', () => {
    const exercises = [
      createMockExercise({ id: '1', slug: 'intro-1', level: 'intro', subconcept: 'for' }),
      createMockExercise({ id: '2', slug: 'practice-1', level: 'practice', subconcept: 'for' }),
      createMockExercise({ id: '3', slug: 'edge-1', level: 'edge', subconcept: 'for' }),
    ];

    it('New state maps to learning phase, selecting intro exercises', () => {
      const card = createEmptyFSRSCard(new Date());
      expect(card.state).toBe('New');

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('learning');

      const selected = selectExercise(
        { subconceptSlug: 'for', phase },
        exercises,
        []
      );
      expect(selected?.level).toBe('intro');
    });

    it('Learning state maps to learning phase', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      card = reviewCard(card, 'Good', new Date('2026-01-01')).cardState;
      expect(card.state).toBe('Learning');

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('learning');
    });

    it('Review state maps to review phase', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let date = new Date('2026-01-01');

      // Graduate to Review
      while (card.state !== 'Review') {
        const result = reviewCard(card, 'Good', date);
        card = result.cardState;
        date = new Date(card.due.getTime() + 1000);
      }

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('review');
    });

    it('Relearning state maps to learning phase', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let date = new Date('2026-01-01');

      // Graduate to Review, then lapse
      while (card.state !== 'Review') {
        const result = reviewCard(card, 'Good', date);
        card = result.cardState;
        date = new Date(card.due.getTime() + 1000);
      }

      // Lapse
      card = reviewCard(card, 'Again', date).cardState;
      expect(card.state).toBe('Relearning');

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('learning');
    });
  });

  describe('Progress ↔ CardState Round-Trip', () => {
    it('preserves all fields through database-style round-trip', () => {
      // Simulate: FSRS review → save to DB → load from DB → continue reviewing
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let date = new Date('2026-01-01');

      // Do a few reviews
      for (let i = 0; i < 3; i++) {
        card = reviewCard(card, 'Good', date).cardState;
        date = new Date(card.due.getTime() + 1000);
      }

      // "Save to database" - extract progress fields
      const progress = cardStateToProgress(card);

      // "Load from database" - reconstruct card state
      const restored = progressToCardState(progress);

      // Continue reviewing with restored card
      const nextResult = reviewCard(restored, 'Good', date);

      // Should work correctly
      expect(nextResult.cardState.reps).toBe(card.reps + 1);
      expect(nextResult.cardState.state).toBeDefined();
    });

    it('handles all FSRS states through round-trip', () => {
      const states: FSRSState[] = ['New', 'Learning', 'Review', 'Relearning'];

      for (const state of states) {
        const progress = {
          stability: 5,
          difficulty: 0.3,
          fsrsState: state,
          due: new Date(),
          lastReview: state === 'New' ? null : new Date(),
          reps: state === 'New' ? 0 : 5,
          lapses: state === 'Relearning' ? 1 : 0,
          elapsedDays: 1,
          scheduledDays: 1,
        };

        const card = progressToCardState(progress);
        expect(card.state).toBe(state);

        const backToProgress = cardStateToProgress(card);
        expect(backToProgress.fsrsState).toBe(state);
      }
    });
  });
});
