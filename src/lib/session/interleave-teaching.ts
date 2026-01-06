import type { ReviewSessionCard, SessionCardType } from './types';
import type { TeachingPair } from './teaching-cards';

const INSERT_INTERVAL = 3; // Insert teaching pair after every 3 review cards

/**
 * Interleaves teaching+practice pairs into a queue of review cards.
 *
 * - Inserts one teaching pair after every 3 review cards
 * - Teaching card always immediately precedes its practice card
 * - Maintains order of both review cards and teaching pairs
 */
export function interleaveWithTeaching(
  reviewCards: ReviewSessionCard[],
  teachingPairs: TeachingPair[]
): SessionCardType[] {
  if (reviewCards.length === 0 && teachingPairs.length === 0) {
    return [];
  }

  if (teachingPairs.length === 0) {
    return [...reviewCards];
  }

  if (reviewCards.length === 0) {
    // Just return all teaching pairs in order
    return teachingPairs.flatMap(pair => [pair.teachingCard, pair.practiceCard]);
  }

  const result: SessionCardType[] = [];
  let reviewIndex = 0;
  let pairIndex = 0;

  while (reviewIndex < reviewCards.length || pairIndex < teachingPairs.length) {
    // Add review cards up to the interval
    let addedReviews = 0;
    while (reviewIndex < reviewCards.length && addedReviews < INSERT_INTERVAL) {
      result.push(reviewCards[reviewIndex]);
      reviewIndex++;
      addedReviews++;
    }

    // Add one teaching pair if available
    if (pairIndex < teachingPairs.length) {
      const pair = teachingPairs[pairIndex];
      result.push(pair.teachingCard);
      result.push(pair.practiceCard);
      pairIndex++;
    }
  }

  return result;
}
