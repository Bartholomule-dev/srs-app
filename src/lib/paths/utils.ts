// src/lib/paths/utils.ts
// Utility functions for the path system

import { hashString } from '@/lib/generators';

/**
 * Pick a random item from an array.
 *
 * @param items - Array of items to pick from
 * @returns A randomly selected item, or undefined if array is empty
 */
export function pickRandomItem<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Pick a deterministic item from an array based on a seed string.
 *
 * Uses a hash function to ensure the same seed always produces
 * the same selection. Useful for:
 * - Consistent skin variable selection per user/exercise
 * - Reproducible random selection for tests
 * - Day-based rotation of values
 *
 * @param items - Array of items to pick from
 * @param seed - String seed for deterministic selection
 * @returns A deterministically selected item, or undefined if array is empty
 */
export function pickSeededItem<T>(items: T[], seed: string): T | undefined {
  if (items.length === 0) return undefined;

  // hashString returns a 64-char hex string, parse first 8 chars as number
  const hash = hashString(seed);
  const hashNum = parseInt(hash.slice(0, 8), 16);
  const index = hashNum % items.length;

  return items[index];
}
