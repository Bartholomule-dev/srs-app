import type { SessionCard } from './types';

/**
 * Interleaves new cards into a queue of due cards.
 * Inserts one new card after every 2-3 due cards to keep variety
 * without overwhelming with unfamiliar content.
 *
 * @param dueCards - Cards due for review (maintains order)
 * @param newCards - New cards to introduce (maintains order)
 * @returns Combined queue with new cards interleaved
 */
export function interleaveCards(
  dueCards: SessionCard[],
  newCards: SessionCard[]
): SessionCard[] {
  if (dueCards.length === 0) {
    return [...newCards];
  }
  if (newCards.length === 0) {
    return [...dueCards];
  }

  const result: SessionCard[] = [];
  const insertInterval = 3; // Insert new card after every 3 due cards
  let dueIndex = 0;
  let newIndex = 0;

  while (dueIndex < dueCards.length || newIndex < newCards.length) {
    // Add due cards up to the interval
    let addedDue = 0;
    while (dueIndex < dueCards.length && addedDue < insertInterval) {
      result.push(dueCards[dueIndex]);
      dueIndex++;
      addedDue++;
    }

    // Add one new card if available
    if (newIndex < newCards.length) {
      result.push(newCards[newIndex]);
      newIndex++;
    }
  }

  return result;
}
