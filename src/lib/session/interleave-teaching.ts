import type { ReviewSessionCard, SessionCardType } from './types';
import type { TeachingPair } from './teaching-cards';

const INSERT_INTERVAL = 3; // Insert teaching pair after every 3 review cards

/**
 * Find indices where concept changes in a sequence of review cards.
 * Returns the index of the first card of each new concept.
 */
export function findConceptBoundaries(reviewCards: ReviewSessionCard[]): number[] {
  if (reviewCards.length <= 1) {
    return [];
  }

  const boundaries: number[] = [];

  for (let i = 1; i < reviewCards.length; i++) {
    const prevConcept = reviewCards[i - 1].exercise.concept;
    const currConcept = reviewCards[i].exercise.concept;

    if (prevConcept !== currConcept) {
      boundaries.push(i);
    }
  }

  return boundaries;
}

/**
 * Interleave teaching pairs at concept boundaries.
 *
 * Strategy:
 * 1. Find concept boundaries in review cards
 * 2. Insert one teaching pair at each boundary (in order)
 * 3. If more teaching pairs than boundaries, prepend extras at start
 * 4. If no boundaries, prepend all teaching pairs at start
 */
export function interleaveAtBoundaries(
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
    return teachingPairs.flatMap(pair => [pair.teachingCard, pair.practiceCard]);
  }

  const boundaries = findConceptBoundaries(reviewCards);
  const result: SessionCardType[] = [];

  // If more pairs than boundaries, prepend extras at the start
  const extraPairs = teachingPairs.length > boundaries.length
    ? teachingPairs.length - boundaries.length
    : 0;

  // Prepend extra teaching pairs (or all if no boundaries)
  for (let i = 0; i < extraPairs; i++) {
    const pair = teachingPairs[i];
    result.push(pair.teachingCard);
    result.push(pair.practiceCard);
  }

  // Build result with teaching pairs at boundaries
  let boundaryIndex = 0;
  const pairsForBoundaries = teachingPairs.slice(extraPairs);

  for (let i = 0; i < reviewCards.length; i++) {
    // Check if this index is a boundary and we have a pair to insert
    if (boundaryIndex < boundaries.length && i === boundaries[boundaryIndex]) {
      // Insert teaching pair before this boundary card
      if (boundaryIndex < pairsForBoundaries.length) {
        const pair = pairsForBoundaries[boundaryIndex];
        result.push(pair.teachingCard);
        result.push(pair.practiceCard);
      }
      boundaryIndex++;
    }
    result.push(reviewCards[i]);
  }

  return result;
}

/**
 * @deprecated Use interleaveAtBoundaries() instead.
 * This function uses fixed intervals (every 3 cards).
 * The new boundary-based approach places teaching at concept transitions.
 *
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
