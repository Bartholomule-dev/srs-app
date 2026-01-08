import { describe, it, expect } from 'vitest';
import { setOpsGenerator } from '@/lib/generators/definitions/set-ops';
import fc from 'fast-check';

describe('set-ops generator', () => {
  it('has correct name', () => {
    expect(setOpsGenerator.name).toBe('set-ops');
  });

  it('generates required params', () => {
    const params = setOpsGenerator.generate('test-seed');
    expect(params).toHaveProperty('set1');
    expect(params).toHaveProperty('set2');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('operation');
    expect(params).toHaveProperty('operationName');
  });

  it('generates deterministic output', () => {
    const p1 = setOpsGenerator.generate('same-seed');
    const p2 = setOpsGenerator.generate('same-seed');
    expect(p1).toEqual(p2);
  });

  it('validates correct params', () => {
    const params = setOpsGenerator.generate('test');
    expect(setOpsGenerator.validate(params)).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (seed) => {
          const params = setOpsGenerator.generate(seed);
          return setOpsGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });
  });
});
