import { describe, it, expect } from 'vitest';
import { zipListsGenerator } from '@/lib/generators/definitions/zip-lists';
import fc from 'fast-check';

describe('zip-lists generator', () => {
  it('has correct name', () => {
    expect(zipListsGenerator.name).toBe('zip-lists');
  });

  it('generates required params', () => {
    const params = zipListsGenerator.generate('test-seed');
    expect(params).toHaveProperty('list1');
    expect(params).toHaveProperty('list2');
    expect(params).toHaveProperty('output');
    expect(params).toHaveProperty('code');
  });

  it('generates deterministic output', () => {
    const p1 = zipListsGenerator.generate('same-seed');
    const p2 = zipListsGenerator.generate('same-seed');
    expect(p1).toEqual(p2);
  });

  it('validates correct params', () => {
    const params = zipListsGenerator.generate('test');
    expect(zipListsGenerator.validate(params)).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (seed) => {
          const params = zipListsGenerator.generate(seed);
          return zipListsGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });
  });
});
