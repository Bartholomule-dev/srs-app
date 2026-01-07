import { describe, it, expect } from 'vitest';
import { stringOpsGenerator } from '@/lib/generators/definitions/string-ops';
import * as fc from 'fast-check';

describe('string-ops generator', () => {
  it('has correct name', () => {
    expect(stringOpsGenerator.name).toBe('string-ops');
  });

  it('generates valid parameters', () => {
    const params = stringOpsGenerator.generate('test-seed');

    expect(params).toHaveProperty('original');
    expect(params).toHaveProperty('method');
    expect(params).toHaveProperty('result');
    expect(['upper', 'lower', 'strip', 'title', 'capitalize']).toContain(params.method);
  });

  it('computes result correctly', () => {
    const params = stringOpsGenerator.generate('fixed-seed');
    const { original, method, result } = params;

    let expected: string;
    const str = original as string;
    switch (method) {
      case 'upper': expected = str.toUpperCase(); break;
      case 'lower': expected = str.toLowerCase(); break;
      case 'strip': expected = str.trim(); break;
      case 'title':
        expected = str.trim().split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      case 'capitalize':
        expected = str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase();
        break;
      default: expected = str;
    }
    expect(result).toBe(expected);
  });

  it('produces deterministic output', () => {
    const params1 = stringOpsGenerator.generate('seed-xyz');
    const params2 = stringOpsGenerator.generate('seed-xyz');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    expect(stringOpsGenerator.validate({
      original: '  Hello  ', method: 'strip', result: 'Hello'
    })).toBe(true);
  });

  it('rejects inconsistent result', () => {
    expect(stringOpsGenerator.validate({
      original: 'hello', method: 'upper', result: 'hello'
    })).toBe(false);
  });

  describe('property-based tests', () => {
    it('always produces valid output across 1000 seeds', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
          const params = stringOpsGenerator.generate(seed);
          return stringOpsGenerator.validate(params);
        }),
        { numRuns: 1000 }
      );
    });
  });
});
