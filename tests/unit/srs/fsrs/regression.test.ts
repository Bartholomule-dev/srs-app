// tests/unit/srs/fsrs/regression.test.ts
// Golden master tests - pin specific FSRS behavior to catch changes
//
// WHY THESE TESTS MATTER:
// - If ts-fsrs library updates change behavior, we'll know
// - If our adapter changes how it calls ts-fsrs, we'll know
// - These are the intervals users will actually experience
//
// If these tests fail after a ts-fsrs upgrade, you need to decide:
// - Is the new behavior better? Update the expected values.
// - Is it a regression? Stay on old version or report bug.

import { describe, it, expect } from 'vitest';
import { createEmptyFSRSCard, reviewCard } from '@/lib/srs/fsrs/adapter';

describe('FSRS Regression Tests - Pinned Behavior', () => {
  // Fixed date for reproducibility
  const FIXED_DATE = new Date('2026-01-01T12:00:00Z');

  describe('New Card First Review', () => {
    it('Good rating on new card produces specific stability', () => {
      const card = createEmptyFSRSCard(FIXED_DATE);
      const result = reviewCard(card, 'Good', FIXED_DATE);

      // Pin the exact stability value (ts-fsrs 5.2.3)
      // If this changes, ts-fsrs behavior changed
      expect(result.cardState.stability).toBeCloseTo(2.31, 1);
      expect(result.cardState.state).toBe('Learning');
      expect(result.cardState.reps).toBe(1);
    });

    it('Easy rating on new card produces higher stability than Good', () => {
      const card = createEmptyFSRSCard(FIXED_DATE);
      const goodResult = reviewCard(card, 'Good', FIXED_DATE);
      const easyResult = reviewCard(card, 'Easy', FIXED_DATE);

      expect(easyResult.cardState.stability).toBeGreaterThan(
        goodResult.cardState.stability
      );
      // Easy should be significantly higher
      expect(easyResult.cardState.stability).toBeGreaterThan(
        goodResult.cardState.stability * 1.3
      );
    });

    it('Again rating keeps card in early state with low stability', () => {
      const card = createEmptyFSRSCard(FIXED_DATE);
      const result = reviewCard(card, 'Again', FIXED_DATE);

      expect(result.cardState.stability).toBeLessThan(1);
      expect(result.cardState.state).toBe('Learning');
      expect(result.wasCorrect).toBe(false);
    });
  });

  describe('Learning to Review Graduation', () => {
    it('graduates to Review state after consistent Good ratings', () => {
      let card = createEmptyFSRSCard(FIXED_DATE);
      let currentTime = FIXED_DATE;
      let result = reviewCard(card, 'Good', currentTime);
      let reviewCount = 1;

      // Count how many Good reviews to reach Review state
      while (result.cardState.state !== 'Review' && reviewCount < 20) {
        currentTime = new Date(result.cardState.due.getTime() + 1000);
        result = reviewCard(result.cardState, 'Good', currentTime);
        reviewCount++;
      }

      // Should reach Review state within reasonable number of reviews
      expect(result.cardState.state).toBe('Review');
      expect(reviewCount).toBeLessThanOrEqual(5);
      expect(reviewCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Review State Interval Growth', () => {
    // Helper to get a card into Review state
    function getReviewStateCard(startDate: Date) {
      let card = createEmptyFSRSCard(startDate);
      let currentTime = startDate;
      let result = reviewCard(card, 'Good', currentTime);

      while (result.cardState.state !== 'Review') {
        currentTime = new Date(result.cardState.due.getTime() + 1000);
        result = reviewCard(result.cardState, 'Good', currentTime);
      }
      return { card: result.cardState, time: currentTime };
    }

    it('intervals grow with consecutive Good ratings in Review state', () => {
      const { card, time } = getReviewStateCard(FIXED_DATE);
      let currentCard = card;
      let currentTime = time;
      const intervals: number[] = [];

      // Do 5 more Good reviews in Review state
      for (let i = 0; i < 5; i++) {
        const result = reviewCard(currentCard, 'Good', currentTime);
        intervals.push(result.cardState.scheduledDays);
        currentCard = result.cardState;
        currentTime = new Date(result.cardState.due.getTime() + 1000);
      }

      // Intervals should generally increase
      // Allow some variance but trend should be up
      const avgFirst2 = (intervals[0] + intervals[1]) / 2;
      const avgLast2 = (intervals[3] + intervals[4]) / 2;
      expect(avgLast2).toBeGreaterThan(avgFirst2);
    });

    it('Easy rating produces longer interval than Good', () => {
      const { card, time } = getReviewStateCard(FIXED_DATE);

      const goodResult = reviewCard(card, 'Good', time);
      const easyResult = reviewCard(card, 'Easy', time);

      expect(easyResult.cardState.scheduledDays).toBeGreaterThan(
        goodResult.cardState.scheduledDays
      );
    });

    it('Hard rating produces shorter interval than Good', () => {
      const { card, time } = getReviewStateCard(FIXED_DATE);

      const goodResult = reviewCard(card, 'Good', time);
      const hardResult = reviewCard(card, 'Hard', time);

      expect(hardResult.cardState.scheduledDays).toBeLessThan(
        goodResult.cardState.scheduledDays
      );
    });
  });

  describe('Lapse Behavior', () => {
    function getReviewStateCard(startDate: Date) {
      let card = createEmptyFSRSCard(startDate);
      let currentTime = startDate;
      let result = reviewCard(card, 'Good', currentTime);

      while (result.cardState.state !== 'Review') {
        currentTime = new Date(result.cardState.due.getTime() + 1000);
        result = reviewCard(result.cardState, 'Good', currentTime);
      }
      return { card: result.cardState, time: currentTime };
    }

    it('Again in Review state causes lapse and moves to Relearning', () => {
      const { card, time } = getReviewStateCard(FIXED_DATE);
      expect(card.lapses).toBe(0);

      const result = reviewCard(card, 'Again', time);

      expect(result.cardState.lapses).toBe(1);
      expect(result.cardState.state).toBe('Relearning');
      expect(result.wasCorrect).toBe(false);
    });

    it('stability decreases significantly after lapse', () => {
      const { card, time } = getReviewStateCard(FIXED_DATE);
      const stabilityBefore = card.stability;

      const result = reviewCard(card, 'Again', time);

      // Stability should drop substantially after forgetting
      expect(result.cardState.stability).toBeLessThan(stabilityBefore * 0.5);
    });

    it('recovery from Relearning restores to Review state', () => {
      const { card, time } = getReviewStateCard(FIXED_DATE);
      const lapseResult = reviewCard(card, 'Again', time);
      expect(lapseResult.cardState.state).toBe('Relearning');

      // Good rating should eventually restore to Review
      let currentCard = lapseResult.cardState;
      let currentTime = new Date(time.getTime() + 1000);
      let recoveryReviews = 0;

      while (currentCard.state !== 'Review' && recoveryReviews < 10) {
        const result = reviewCard(currentCard, 'Good', currentTime);
        currentCard = result.cardState;
        currentTime = new Date(result.cardState.due.getTime() + 1000);
        recoveryReviews++;
      }

      expect(currentCard.state).toBe('Review');
      expect(recoveryReviews).toBeLessThanOrEqual(5);
    });
  });

  describe('Real-World Scenario: One Week of Practice', () => {
    it('simulates realistic learning progression', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-01T09:00:00Z'));
      const reviews: Array<{
        day: number;
        rating: 'Again' | 'Hard' | 'Good' | 'Easy';
      }> = [
        { day: 1, rating: 'Good' },     // First exposure - okay
        { day: 1, rating: 'Good' },     // Same day review - getting it
        { day: 2, rating: 'Hard' },     // Next day - struggled a bit
        { day: 3, rating: 'Good' },     // Day 3 - back on track
        { day: 5, rating: 'Good' },     // Skip a day - still remember
        { day: 8, rating: 'Easy' },     // Week later - nailed it
      ];

      let currentCard = card;
      let baseDate = new Date('2026-01-01T09:00:00Z');

      for (const review of reviews) {
        const reviewDate = new Date(
          baseDate.getTime() + (review.day - 1) * 24 * 60 * 60 * 1000
        );
        const result = reviewCard(currentCard, review.rating, reviewDate);
        currentCard = result.cardState;
      }

      // After a week of solid practice:
      expect(currentCard.state).toBe('Review');
      expect(currentCard.stability).toBeGreaterThan(5);
      expect(currentCard.lapses).toBe(0);
      expect(currentCard.reps).toBe(6);
      // Next review should be several days out
      expect(currentCard.scheduledDays).toBeGreaterThan(3);
    });

    it('simulates struggling learner with recovery', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-01T09:00:00Z'));
      const reviews: Array<{
        day: number;
        rating: 'Again' | 'Hard' | 'Good' | 'Easy';
      }> = [
        { day: 1, rating: 'Hard' },     // First exposure - struggled
        { day: 1, rating: 'Again' },    // Retry - forgot
        { day: 1, rating: 'Hard' },     // Getting it slowly
        { day: 2, rating: 'Good' },     // Better next day
        { day: 3, rating: 'Good' },     // Improving
        { day: 5, rating: 'Good' },     // Solid now
      ];

      let currentCard = card;
      let baseDate = new Date('2026-01-01T09:00:00Z');

      for (const review of reviews) {
        const reviewDate = new Date(
          baseDate.getTime() + (review.day - 1) * 24 * 60 * 60 * 1000
        );
        const result = reviewCard(currentCard, review.rating, reviewDate);
        currentCard = result.cardState;
      }

      // Struggling learner should still make progress but slower
      expect(currentCard.reps).toBe(6);
      // Should have recovered despite early struggles
      expect(['Learning', 'Review']).toContain(currentCard.state);
    });
  });
});
