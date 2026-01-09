// tests/unit/paths/render-skin-vars.test.ts
import { describe, it, expect } from 'vitest';
import { expandSkinVars } from '@/lib/paths/render-skin-vars';
import type { SkinVars } from '@/lib/paths/types';

describe('expandSkinVars', () => {
  const skinVars: SkinVars = {
    list_name: 'tasks',
    item_singular: 'task',
    item_plural: 'tasks',
    item_examples: ['buy groceries', 'call mom', 'email boss'],
    record_keys: ['title', 'done', 'priority'],
  };

  it('passes through static values unchanged', () => {
    const result = expandSkinVars(skinVars, 'seed-1');

    expect(result.list_name).toBe('tasks');
    expect(result.item_singular).toBe('task');
  });

  it('picks a single item from arrays for item_example', () => {
    const result = expandSkinVars(skinVars, 'seed-1');

    expect(typeof result.item_example).toBe('string');
    expect(skinVars.item_examples).toContain(result.item_example);
  });

  it('picks deterministically based on seed', () => {
    const result1 = expandSkinVars(skinVars, 'same-seed');
    const result2 = expandSkinVars(skinVars, 'same-seed');

    expect(result1.item_example).toBe(result2.item_example);
  });

  it('picks different items for different seeds', () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const result = expandSkinVars(skinVars, `seed-${i}`);
      results.add(result.item_example as string);
    }

    expect(results.size).toBeGreaterThan(1);
  });

  it('handles missing array gracefully', () => {
    const sparseVars: SkinVars = {
      list_name: 'items',
      item_singular: 'item',
      item_plural: 'items',
      item_examples: [],
      record_keys: [],
    };

    const result = expandSkinVars(sparseVars, 'seed');

    expect(result.item_example).toBeUndefined();
  });

  it('keeps the original arrays in addition to picked singles', () => {
    const result = expandSkinVars(skinVars, 'seed-1');

    // Should have both the array and the picked single
    expect(result.item_examples).toEqual(skinVars.item_examples);
    expect(typeof result.item_example).toBe('string');
  });
});
