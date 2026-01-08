import { describe, it, expect } from 'vitest';
import { truthinessGenerator } from '@/lib/generators/definitions/truthiness';

describe('truthinessGenerator', () => {
  it('generates valid truthiness scenarios', () => {
    const params = truthinessGenerator.generate('test-seed-123');

    expect(params).toHaveProperty('valueStr');
    expect(params).toHaveProperty('isTruthy');
    expect(params).toHaveProperty('category');
    expect(['True', 'False']).toContain(params.isTruthy);
  });

  it('generates consistent results for same seed', () => {
    const params1 = truthinessGenerator.generate('consistent-seed');
    const params2 = truthinessGenerator.generate('consistent-seed');

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const params = truthinessGenerator.generate('valid-test');
    expect(truthinessGenerator.validate(params)).toBe(true);
  });

  it('rejects invalid params', () => {
    expect(truthinessGenerator.validate({ value: 'x', isTruthy: 'Maybe' })).toBe(false);
    expect(truthinessGenerator.validate({})).toBe(false);
  });

  it('covers falsy values', () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const params = truthinessGenerator.generate(`falsy-${i}`);
      if (params.isTruthy === 'False') {
        results.add(params.category as string);
      }
    }
    // Should cover multiple falsy categories
    expect(results.size).toBeGreaterThan(2);
  });
});
