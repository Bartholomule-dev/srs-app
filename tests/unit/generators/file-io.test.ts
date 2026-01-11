// tests/unit/generators/file-io.test.ts
import { describe, it, expect } from 'vitest';
import { fileIOGenerator } from '@/lib/generators/definitions/file-io';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('file-io generator', () => {
  it('has correct name', () => {
    expect(fileIOGenerator.name).toBe('file-io');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = fileIOGenerator.generate(seed);

    expect(params).toHaveProperty('filename');
    expect(params).toHaveProperty('mode');
    expect(params).toHaveProperty('content');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('operation');
    expect(params).toHaveProperty('scenario');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = fileIOGenerator.generate(seed);
    const params2 = fileIOGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = fileIOGenerator.generate(seed);

    expect(fileIOGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'read_all',
      'read_lines',
      'write_text',
      'append_text',
      'context_manager',
      'read_first_line',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = fileIOGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('produces valid operation types', () => {
    const validOps = ['read', 'write', 'append', 'context'];
    const seed = createSeed('user1', 'test', new Date());
    const params = fileIOGenerator.generate(seed);

    expect(validOps).toContain(params.operation);
  });

  it('filename has valid extension', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = fileIOGenerator.generate(seed);
    const filename = params.filename as string;

    // TinyStore lexicon uses various file extensions
    expect(filename).toMatch(/\.(csv|json|log|txt)$/);
  });

  it('code contains open()', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = fileIOGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('open(');
  });

  it('code contains with statement', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = fileIOGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('with ');
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = fileIOGenerator.generate(seed);
          return fileIOGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('mode is valid', () => {
      const validModes = ['r', 'w', 'a'];
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = fileIOGenerator.generate(seed);
          const mode = params.mode as string;
          return validModes.includes(mode);
        }),
        { numRuns: 100 }
      );
    });

    it('result is non-empty', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = fileIOGenerator.generate(seed);
          const result = params.result as string;
          return typeof result === 'string' && result.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
