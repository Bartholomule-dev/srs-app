import { describe, it, expect } from 'vitest';
import { tupleAccessGenerator } from '@/lib/generators/definitions/tuple-access';
import fc from 'fast-check';

describe('tuple-access generator', () => {
  it('has correct name', () => {
    expect(tupleAccessGenerator.name).toBe('tuple-access');
  });

  it('generates required params', () => {
    const params = tupleAccessGenerator.generate('test-seed');
    expect(params).toHaveProperty('tuple');
    expect(params).toHaveProperty('tupleVar');
    expect(params).toHaveProperty('index');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('length');
  });

  it('generates deterministic output', () => {
    const p1 = tupleAccessGenerator.generate('same-seed');
    const p2 = tupleAccessGenerator.generate('same-seed');
    expect(p1).toEqual(p2);
  });

  it('validates correct params', () => {
    const params = tupleAccessGenerator.generate('test');
    expect(tupleAccessGenerator.validate(params)).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (seed) => {
          const params = tupleAccessGenerator.generate(seed);
          return tupleAccessGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });
  });
});
