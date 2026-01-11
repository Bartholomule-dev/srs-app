// tests/unit/generators/registry.test.ts
// Tests for language-scoped generator registry

import { describe, it, expect } from 'vitest';
import {
  getGenerator,
  hasGenerator,
  getGeneratorNames,
  getSupportedLanguages,
  registerGenerator,
} from '@/lib/generators';
import type { Generator } from '@/lib/generators';

describe('Language-Scoped Generator Registry', () => {
  describe('getGenerator', () => {
    it('returns Python generator by default', () => {
      const generator = getGenerator('slice-bounds');
      expect(generator).toBeDefined();
      expect(generator?.name).toBe('slice-bounds');
    });

    it('returns Python generator when explicitly specifying python', () => {
      const generator = getGenerator('slice-bounds', 'python');
      expect(generator).toBeDefined();
      expect(generator?.name).toBe('slice-bounds');
    });

    it('returns undefined for Python generator when asking for JavaScript', () => {
      const generator = getGenerator('slice-bounds', 'javascript');
      expect(generator).toBeUndefined();
    });

    it('returns undefined for non-existent generator', () => {
      const generator = getGenerator('non-existent-generator');
      expect(generator).toBeUndefined();
    });

    it('returns undefined for non-existent generator in JavaScript', () => {
      const generator = getGenerator('non-existent-generator', 'javascript');
      expect(generator).toBeUndefined();
    });
  });

  describe('hasGenerator', () => {
    it('returns true for Python generator by default', () => {
      expect(hasGenerator('slice-bounds')).toBe(true);
    });

    it('returns true for Python generator when explicitly specifying python', () => {
      expect(hasGenerator('slice-bounds', 'python')).toBe(true);
    });

    it('returns false for Python generator when asking for JavaScript', () => {
      expect(hasGenerator('slice-bounds', 'javascript')).toBe(false);
    });

    it('returns false for non-existent generator', () => {
      expect(hasGenerator('non-existent-generator')).toBe(false);
    });

    it('checks language-specific for multiple generators', () => {
      // All these are Python generators
      expect(hasGenerator('list-values', 'python')).toBe(true);
      expect(hasGenerator('dict-values', 'python')).toBe(true);
      expect(hasGenerator('string-ops', 'python')).toBe(true);

      // None exist in JavaScript yet
      expect(hasGenerator('list-values', 'javascript')).toBe(false);
      expect(hasGenerator('dict-values', 'javascript')).toBe(false);
      expect(hasGenerator('string-ops', 'javascript')).toBe(false);
    });
  });

  describe('getGeneratorNames', () => {
    it('returns Python generator names by default', () => {
      const names = getGeneratorNames();
      expect(names).toContain('slice-bounds');
      expect(names).toContain('list-values');
      expect(names).toContain('dict-values');
      expect(names.length).toBe(38); // All 38 Python generators
    });

    it('returns Python generator names when explicitly specifying python', () => {
      const names = getGeneratorNames('python');
      expect(names).toContain('slice-bounds');
      expect(names.length).toBe(38);
    });

    it('returns empty array for JavaScript (no generators yet)', () => {
      const names = getGeneratorNames('javascript');
      expect(names).toEqual([]);
      expect(names.length).toBe(0);
    });

    it('returns all 38 Python generators', () => {
      const names = getGeneratorNames('python');
      const expectedGenerators = [
        'slice-bounds',
        'variable-names',
        'list-values',
        'index-values',
        'arithmetic-values',
        'loop-simulation',
        'comparison-logic',
        'string-ops',
        'dict-values',
        'comp-mapping',
        'comp-filter',
        'try-except-flow',
        'oop-instance',
        'function-call',
        'string-format',
        'path-ops',
        'lambda-expr',
        'dict-comp',
        'class-method',
        'exception-scenario',
        'bool-logic',
        'list-method',
        'nested-access',
        'string-slice',
        'conditional-chain',
        'list-transform',
        'file-io',
        'inheritance-method',
        'operator-chain',
        'default-args',
        'finally-flow',
        'tuple-access',
        'any-all',
        'set-ops',
        'sorted-list',
        'zip-lists',
        'type-conversion',
        'truthiness',
      ];

      for (const name of expectedGenerators) {
        expect(names).toContain(name);
      }
    });
  });

  describe('getSupportedLanguages', () => {
    it('returns python and javascript', () => {
      const languages = getSupportedLanguages();
      expect(languages).toContain('python');
      expect(languages).toContain('javascript');
      expect(languages.length).toBe(2);
    });
  });

  describe('registerGenerator', () => {
    it('registers a generator for Python by default', () => {
      const mockGenerator: Generator = {
        name: 'test-generator-python',
        generate: () => ({ value: 1 }),
        validate: () => true,
      };

      registerGenerator(mockGenerator);
      expect(hasGenerator('test-generator-python', 'python')).toBe(true);
      expect(hasGenerator('test-generator-python', 'javascript')).toBe(false);
    });

    it('registers a generator for JavaScript when specified', () => {
      const mockGenerator: Generator = {
        name: 'test-generator-js',
        generate: () => ({ value: 1 }),
        validate: () => true,
      };

      registerGenerator(mockGenerator, 'javascript');
      expect(hasGenerator('test-generator-js', 'javascript')).toBe(true);
      expect(hasGenerator('test-generator-js', 'python')).toBe(false);
    });
  });

  describe('backward compatibility', () => {
    it('maintains same behavior as before for default (Python) usage', () => {
      // These calls should work identically to before the language-scoping change
      const generator = getGenerator('slice-bounds');
      expect(generator).toBeDefined();
      expect(generator?.name).toBe('slice-bounds');

      expect(hasGenerator('slice-bounds')).toBe(true);
      expect(hasGenerator('non-existent')).toBe(false);

      const names = getGeneratorNames();
      // At least 38 built-in generators (may be more if test registered extras)
      expect(names.length).toBeGreaterThanOrEqual(38);
    });

    it('generator generate() function works correctly', () => {
      const generator = getGenerator('slice-bounds');
      expect(generator).toBeDefined();

      const params = generator!.generate('test-seed-123');
      expect(params).toBeDefined();
      expect(typeof params.start).toBe('number');
      expect(typeof params.end).toBe('number');
    });

    it('generator validate() function works correctly', () => {
      const generator = getGenerator('slice-bounds');
      expect(generator).toBeDefined();

      const validParams = generator!.generate('test-seed-123');
      expect(generator!.validate(validParams)).toBe(true);
    });
  });
});
