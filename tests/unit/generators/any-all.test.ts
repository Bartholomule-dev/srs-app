import { describe, it, expect } from 'vitest';
import { anyAllGenerator } from '@/lib/generators/definitions/any-all';
import fc from 'fast-check';

describe('any-all generator', () => {
  it('has correct name', () => {
    expect(anyAllGenerator.name).toBe('any-all');
  });

  it('generates required params', () => {
    const params = anyAllGenerator.generate('test-seed');
    expect(params).toHaveProperty('list');
    expect(params).toHaveProperty('func');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('code');
  });

  it('generates deterministic output', () => {
    const p1 = anyAllGenerator.generate('same-seed');
    const p2 = anyAllGenerator.generate('same-seed');
    expect(p1).toEqual(p2);
  });

  it('validates correct params', () => {
    const params = anyAllGenerator.generate('test');
    expect(anyAllGenerator.validate(params)).toBe(true);
  });

  it('result is True or False', () => {
    const params = anyAllGenerator.generate('test');
    expect(['True', 'False']).toContain(params.result);
  });

  describe('property-based tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (seed) => {
          const params = anyAllGenerator.generate(seed);
          return anyAllGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });
  });
});
