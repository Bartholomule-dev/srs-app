// src/lib/generators/javascript/index.ts
// JavaScript generators module - stub for future implementation

import type { Generator } from '../types';

/**
 * Registry of all JavaScript generators.
 * Currently empty - will be populated as JavaScript exercises are added.
 */
export const generators: Map<string, Generator> = new Map();

/**
 * Get a JavaScript generator by name.
 */
export function getGenerator(name: string): Generator | undefined {
  return generators.get(name);
}

/**
 * Check if a JavaScript generator exists.
 */
export function hasGenerator(name: string): boolean {
  return generators.has(name);
}

/**
 * Get all registered JavaScript generator names.
 */
export function getGeneratorNames(): string[] {
  return Array.from(generators.keys());
}
