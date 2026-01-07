import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyFSRSCard,
  reviewCard,
  cardStateToProgress,
  progressToCardState,
} from '@/lib/srs/fsrs/adapter';
import type { FSRSCardState } from '@/lib/srs/fsrs/types';

describe('createEmptyFSRSCard', () => {
  it('creates a new card with default values', () => {
    const card = createEmptyFSRSCard();
    expect(card.state).toBe('New');
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it('accepts a custom due date', () => {
    const customDate = new Date('2026-01-15');
    const card = createEmptyFSRSCard(customDate);
    expect(card.due.toISOString()).toBe(customDate.toISOString());
  });

  it('has null lastReview for new cards', () => {
    const card = createEmptyFSRSCard();
    expect(card.lastReview).toBeNull();
  });

  it('initializes elapsedDays and scheduledDays to 0', () => {
    const card = createEmptyFSRSCard();
    expect(card.elapsedDays).toBe(0);
    expect(card.scheduledDays).toBe(0);
  });
});

describe('reviewCard', () => {
  let newCard: FSRSCardState;
  const reviewDate = new Date('2026-01-01T12:00:00Z');

  beforeEach(() => {
    newCard = createEmptyFSRSCard(new Date('2026-01-01T12:00:00Z'));
  });

  it('schedules next review after Good rating', () => {
    const result = reviewCard(newCard, 'Good', reviewDate);
    expect(result.cardState.state).toBe('Learning');
    expect(result.cardState.due > reviewDate).toBe(true);
    expect(result.cardState.reps).toBe(1);
    expect(result.rating).toBe('Good');
    expect(result.wasCorrect).toBe(true);
  });

  it('returns wasCorrect=false for Again rating', () => {
    const result = reviewCard(newCard, 'Again', reviewDate);
    expect(result.wasCorrect).toBe(false);
    expect(result.rating).toBe('Again');
  });

  it('returns wasCorrect=true for Hard rating', () => {
    const result = reviewCard(newCard, 'Hard', reviewDate);
    expect(result.wasCorrect).toBe(true);
    expect(result.rating).toBe('Hard');
  });

  it('returns wasCorrect=true for Easy rating', () => {
    const result = reviewCard(newCard, 'Easy', reviewDate);
    expect(result.wasCorrect).toBe(true);
    expect(result.rating).toBe('Easy');
  });

  it('updates stability and difficulty after review', () => {
    const result = reviewCard(newCard, 'Good', reviewDate);
    // After first review, stability should be set
    expect(result.cardState.stability).toBeGreaterThan(0);
  });

  it('increments reps on each review', () => {
    const result1 = reviewCard(newCard, 'Good', reviewDate);
    expect(result1.cardState.reps).toBe(1);

    const nextDate = new Date('2026-01-02T12:00:00Z');
    const result2 = reviewCard(result1.cardState, 'Good', nextDate);
    expect(result2.cardState.reps).toBe(2);
  });

  it('increments lapses on Again rating for Review state cards', () => {
    // Progress the card to Review state by passing Good repeatedly
    // In FSRS, lapses only increment when a Review state card gets Again
    let card = newCard;
    let date = reviewDate;

    // Graduate to Review state - need to pass Learning steps
    while (card.state !== 'Review') {
      const result = reviewCard(card, 'Good', date);
      card = result.cardState;
      // Move date forward by scheduled days to simulate proper review timing
      date = new Date(date.getTime() + (card.scheduledDays + 1) * 24 * 60 * 60 * 1000);
    }

    expect(card.state).toBe('Review');
    expect(card.lapses).toBe(0);

    // Now fail it - this should increment lapses
    const result = reviewCard(card, 'Again', date);
    expect(result.cardState.lapses).toBe(1);
    expect(result.cardState.state).toBe('Relearning');
  });

  it('sets lastReview after review', () => {
    expect(newCard.lastReview).toBeNull();
    const result = reviewCard(newCard, 'Good', reviewDate);
    expect(result.cardState.lastReview).not.toBeNull();
    expect(result.cardState.lastReview?.toISOString()).toBe(reviewDate.toISOString());
  });
});

describe('cardStateToProgress / progressToCardState', () => {
  it('round-trips card state correctly', () => {
    const original = createEmptyFSRSCard(new Date('2026-01-01'));
    const reviewed = reviewCard(original, 'Good', new Date('2026-01-01'));
    const progressFields = cardStateToProgress(reviewed.cardState);
    const restored = progressToCardState(progressFields);

    expect(restored.state).toBe(reviewed.cardState.state);
    expect(restored.stability).toBe(reviewed.cardState.stability);
    expect(restored.difficulty).toBe(reviewed.cardState.difficulty);
    expect(restored.reps).toBe(reviewed.cardState.reps);
    expect(restored.lapses).toBe(reviewed.cardState.lapses);
    expect(restored.elapsedDays).toBe(reviewed.cardState.elapsedDays);
    expect(restored.scheduledDays).toBe(reviewed.cardState.scheduledDays);
  });

  it('preserves due date through round-trip', () => {
    const dueDate = new Date('2026-01-15T10:30:00Z');
    const card = createEmptyFSRSCard(dueDate);
    const progress = cardStateToProgress(card);
    const restored = progressToCardState(progress);

    expect(restored.due.toISOString()).toBe(dueDate.toISOString());
  });

  it('preserves lastReview through round-trip', () => {
    const card = createEmptyFSRSCard(new Date('2026-01-01'));
    const reviewed = reviewCard(card, 'Good', new Date('2026-01-01T12:00:00Z'));
    const progress = cardStateToProgress(reviewed.cardState);
    const restored = progressToCardState(progress);

    expect(restored.lastReview?.toISOString()).toBe(
      reviewed.cardState.lastReview?.toISOString()
    );
  });

  it('handles null lastReview', () => {
    const card = createEmptyFSRSCard(new Date('2026-01-01'));
    const progress = cardStateToProgress(card);
    const restored = progressToCardState(progress);

    expect(restored.lastReview).toBeNull();
  });
});
