// tests/unit/generators/string-format.test.ts
import { describe, it, expect } from 'vitest';
import { stringFormatGenerator } from '@/lib/generators/definitions/string-format';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('string-format generator', () => {
  it('has correct name', () => {
    expect(stringFormatGenerator.name).toBe('string-format');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = stringFormatGenerator.generate(seed);

    expect(params).toHaveProperty('variant');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('fstring');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = stringFormatGenerator.generate(seed);
    const params2 = stringFormatGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('generates different output for different seeds', () => {
    const seed1 = createSeed('user1', 'test', new Date('2026-01-08'));
    const seed2 = createSeed('user2', 'test', new Date('2026-01-08'));

    const params1 = stringFormatGenerator.generate(seed1);
    const params2 = stringFormatGenerator.generate(seed2);

    // Different users should see different exercises
    expect(params1.result !== params2.result || params1.variant !== params2.variant).toBe(true);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = stringFormatGenerator.generate(seed);

    expect(stringFormatGenerator.validate(params)).toBe(true);
  });

  it('rejects invalid variant', () => {
    const params = {
      variant: 'unknown',
      result: 'Hello',
    };
    expect(stringFormatGenerator.validate(params)).toBe(false);
  });

  describe('greeting variant', () => {
    it('produces correct format', () => {
      // Find a seed that produces the greeting variant
      let params;
      for (let i = 0; i < 100; i++) {
        params = stringFormatGenerator.generate(`seed-${i}`);
        if (params.variant === 'greeting') break;
      }

      if (params?.variant === 'greeting') {
        expect(params.result).toMatch(/Hello, \w+! You are \d+ years old\./);
        expect(params.name).toBeDefined();
        expect(params.age).toBeDefined();
      }
    });
  });

  describe('price variant', () => {
    it('produces correct format', () => {
      let params;
      for (let i = 0; i < 100; i++) {
        params = stringFormatGenerator.generate(`seed-price-${i}`);
        if (params.variant === 'price') break;
      }

      if (params?.variant === 'price') {
        expect(params.result).toMatch(/\d+ \w+\(s\) at \$\d+ each: \$\d+/);
        expect(params.item).toBeDefined();
        expect(params.price).toBeDefined();
        expect(params.qty).toBeDefined();
      }
    });
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = stringFormatGenerator.generate(seed);
          return stringFormatGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('always includes valid variant', () => {
      const validVariants = ['greeting', 'price', 'stats', 'message'];

      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = stringFormatGenerator.generate(seed);
          return validVariants.includes(params.variant as string);
        }),
        { numRuns: 100 }
      );
    });

    it('result always contains expected structure', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = stringFormatGenerator.generate(seed);
          const result = params.result as string;
          // All variants produce non-empty strings
          return result.length > 0 && typeof result === 'string';
        }),
        { numRuns: 100 }
      );
    });
  });
});
