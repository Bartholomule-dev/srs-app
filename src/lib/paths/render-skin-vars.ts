// src/lib/paths/render-skin-vars.ts
import type { SkinVars } from './types';
import type { GeneratorParams } from '@/lib/generators/types';
import { pickSeededItem } from './utils';

/**
 * Expand skin vars for template rendering.
 *
 * Arrays like item_examples get a single item picked deterministically.
 * This creates:
 * - item_example (singular from item_examples)
 * - record_key (first key from record_keys, or single picked value)
 *
 * @param skinVars - The skin's variable definitions
 * @param seed - Seed for deterministic selection
 * @returns Expanded params suitable for Mustache rendering
 */
export function expandSkinVars(
  skinVars: SkinVars,
  seed: string
): GeneratorParams {
  const expanded: GeneratorParams = {};

  for (const [key, value] of Object.entries(skinVars)) {
    if (Array.isArray(value)) {
      // Pick a single item from the array
      const singularKey = key.replace(/_examples$/, '_example')
                            .replace(/_keys$/, '_key');
      const picked = pickSeededItem(value as string[], `${seed}:${key}`);
      if (picked !== undefined) {
        expanded[singularKey] = picked;
      }
      // Also keep the full array for potential iteration
      expanded[key] = value;
    } else {
      expanded[key] = value;
    }
  }

  return expanded;
}
