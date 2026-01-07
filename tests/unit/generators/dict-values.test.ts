import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { dictValuesGenerator } from '@/lib/generators/definitions/dict-values';

describe('dict-values generator', () => {
  it('has correct name', () => {
    expect(dictValuesGenerator.name).toBe('dict-values');
  });

  it('generates valid parameters', () => {
    const params = dictValuesGenerator.generate('test-seed');

    expect(params).toHaveProperty('dict_str');
    expect(params).toHaveProperty('key');
    expect(params).toHaveProperty('value');
    expect(params).toHaveProperty('exists');
    expect(typeof params.dict_str).toBe('string');
    expect(typeof params.key).toBe('string');
    expect(typeof params.exists).toBe('boolean');
  });

  it('dict_str is valid Python dict syntax', () => {
    const params = dictValuesGenerator.generate('test-seed');
    const dictStr = params.dict_str as string;

    expect(dictStr.startsWith('{')).toBe(true);
    expect(dictStr.endsWith('}')).toBe(true);
  });

  it('generates existing key scenarios', () => {
    let foundExisting = false;
    for (let i = 0; i < 100; i++) {
      const params = dictValuesGenerator.generate(`seed-${i}`);
      if (params.exists === true) {
        foundExisting = true;
        expect(params.value).toBeDefined();
        break;
      }
    }
    expect(foundExisting).toBe(true);
  });

  it('produces deterministic output', () => {
    const params1 = dictValuesGenerator.generate('seed-xyz');
    const params2 = dictValuesGenerator.generate('seed-xyz');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    expect(dictValuesGenerator.validate({
      dict_str: '{"a": 1, "b": 2}',
      key: 'a',
      value: '1',
      exists: true
    })).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid output across 1000 seeds', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
          const params = dictValuesGenerator.generate(seed);
          return dictValuesGenerator.validate(params);
        }),
        { numRuns: 1000 }
      );
    });
  });
});
