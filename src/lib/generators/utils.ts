// src/lib/generators/utils.ts
// Seeded random number generation utilities for deterministic parameter generation

import seedrandom from 'seedrandom';

/**
 * Seeded random number generator interface.
 * Provides deterministic random values from a seed string.
 */
export interface SeededRandom {
  /** Get next random float in [0, 1) */
  next(): number;

  /** Get random integer in [min, max] inclusive */
  int(min: number, max: number): number;

  /** Pick random element from array */
  pick<T>(items: T[]): T;

  /** Shuffle array (Fisher-Yates) - returns new array */
  shuffle<T>(items: T[]): T[];
}

/**
 * Create a seeded random number generator.
 *
 * @param seed - String seed for determinism
 * @returns SeededRandom instance with utility methods
 */
export function seededRandom(seed: string): SeededRandom {
  const rng = seedrandom(seed);

  return {
    next(): number {
      return rng();
    },

    int(min: number, max: number): number {
      if (min === max) return min;
      // rng() returns [0, 1), scale to [min, max]
      return Math.floor(rng() * (max - min + 1)) + min;
    },

    pick<T>(items: T[]): T {
      if (items.length === 0) {
        throw new Error('Cannot pick from empty array');
      }
      const index = Math.floor(rng() * items.length);
      return items[index];
    },

    shuffle<T>(items: T[]): T[] {
      // Fisher-Yates shuffle on a copy
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
  };
}
