// tests/unit/generators/variable-names.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { variableNamesGenerator } from '@/lib/generators/definitions/variable-names';

describe('variableNamesGenerator', () => {
  it('has correct name', () => {
    expect(variableNamesGenerator.name).toBe('variable-names');
  });

  describe('generate()', () => {
    it('returns name and name2 parameters', () => {
      const params = variableNamesGenerator.generate('test-seed');
      expect(typeof params.name).toBe('string');
      expect(typeof params.name2).toBe('string');
    });

    it('generates valid Python identifiers', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
      const validIdentifier = /^[a-z][a-z0-9_]*$/;
      for (const seed of seeds) {
        const params = variableNamesGenerator.generate(seed);
        expect(params.name).toMatch(validIdentifier);
        expect(params.name2).toMatch(validIdentifier);
      }
    });

    it('generates different values for name and name2', () => {
      const params = variableNamesGenerator.generate('test');
      expect(params.name).not.toBe(params.name2);
    });

    it('is deterministic', () => {
      const params1 = variableNamesGenerator.generate('fixed');
      const params2 = variableNamesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });
  });

  describe('validate()', () => {
    it('returns true for valid names', () => {
      expect(variableNamesGenerator.validate({ name: 'foo', name2: 'bar' })).toBe(true);
      expect(variableNamesGenerator.validate({ name: 'my_var', name2: 'x2' })).toBe(true);
    });

    it('returns false for invalid identifiers', () => {
      expect(variableNamesGenerator.validate({ name: '123', name2: 'bar' })).toBe(false);
      expect(variableNamesGenerator.validate({ name: 'foo', name2: 'class' })).toBe(false);
    });

    it('returns false for same name', () => {
      expect(variableNamesGenerator.validate({ name: 'foo', name2: 'foo' })).toBe(false);
    });

    it('returns false for non-strings', () => {
      expect(variableNamesGenerator.validate({ name: 123, name2: 'bar' })).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = variableNamesGenerator.generate(seed);
          return variableNamesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });
  });
});
