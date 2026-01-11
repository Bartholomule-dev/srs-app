// tests/unit/generators/path-ops.test.ts
import { describe, it, expect } from 'vitest';
import { pathOpsGenerator } from '@/lib/generators/definitions/path-ops';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('path-ops generator', () => {
  it('has correct name', () => {
    expect(pathOpsGenerator.name).toBe('path-ops');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = pathOpsGenerator.generate(seed);

    expect(params).toHaveProperty('dir1');
    expect(params).toHaveProperty('dir2');
    expect(params).toHaveProperty('filename');
    expect(params).toHaveProperty('fullPath');
    expect(params).toHaveProperty('parent');
    expect(params).toHaveProperty('stem');
    expect(params).toHaveProperty('suffix');
    expect(params).toHaveProperty('variant');
    expect(params).toHaveProperty('result');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = pathOpsGenerator.generate(seed);
    const params2 = pathOpsGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('generates different output for different seeds', () => {
    const seed1 = createSeed('user1', 'test', new Date('2026-01-08'));
    const seed2 = createSeed('user2', 'test', new Date('2026-01-08'));

    const params1 = pathOpsGenerator.generate(seed1);
    const params2 = pathOpsGenerator.generate(seed2);

    expect(
      params1.fullPath !== params2.fullPath || params1.variant !== params2.variant
    ).toBe(true);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = pathOpsGenerator.generate(seed);

    expect(pathOpsGenerator.validate(params)).toBe(true);
  });

  it('constructs fullPath correctly', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = pathOpsGenerator.generate(seed);

    expect(params.fullPath).toBe(`${params.dir1}/${params.dir2}/${params.filename}`);
  });

  it('constructs parent correctly', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = pathOpsGenerator.generate(seed);

    expect(params.parent).toBe(`${params.dir1}/${params.dir2}`);
  });

  it('produces valid file extension', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = pathOpsGenerator.generate(seed);

    // TinyStore lexicon file extensions
    expect(['.csv', '.json', '.log', '.txt']).toContain(params.suffix);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = pathOpsGenerator.generate(seed);
          return pathOpsGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('always produces valid path structure', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = pathOpsGenerator.generate(seed);
          const { fullPath, dir1, dir2, filename } = params;
          return fullPath === `${dir1}/${dir2}/${filename}`;
        }),
        { numRuns: 100 }
      );
    });
  });
});
