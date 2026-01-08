import { describe, it, expect } from 'vitest';
import { sortedListGenerator } from '@/lib/generators/definitions/sorted-list';
import fc from 'fast-check';

describe('sorted-list generator', () => {
  it('has correct name', () => {
    expect(sortedListGenerator.name).toBe('sorted-list');
  });

  it('generates required params', () => {
    const params = sortedListGenerator.generate('test-seed');
    expect(params).toHaveProperty('input');
    expect(params).toHaveProperty('output');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('func');
  });

  it('generates deterministic output', () => {
    const p1 = sortedListGenerator.generate('same-seed');
    const p2 = sortedListGenerator.generate('same-seed');
    expect(p1).toEqual(p2);
  });

  it('validates correct params', () => {
    const params = sortedListGenerator.generate('test');
    expect(sortedListGenerator.validate(params)).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (seed) => {
          const params = sortedListGenerator.generate(seed);
          return sortedListGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });
  });
});
