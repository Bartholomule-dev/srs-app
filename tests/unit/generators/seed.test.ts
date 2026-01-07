// tests/unit/generators/seed.test.ts
import { describe, it, expect } from 'vitest';
import { createSeed, hashString } from '@/lib/generators/seed';

describe('hashString', () => {
  it('produces consistent output for same input', () => {
    const hash1 = hashString('test-input');
    const hash2 = hashString('test-input');
    expect(hash1).toBe(hash2);
  });

  it('produces different output for different inputs', () => {
    const hash1 = hashString('input-a');
    const hash2 = hashString('input-b');
    expect(hash1).not.toBe(hash2);
  });

  it('produces a 64-character hex string', () => {
    const hash = hashString('any-input');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('createSeed', () => {
  it('combines userId, exerciseSlug, and date into a seed', () => {
    const seed = createSeed('user-123', 'string-slice', new Date('2026-01-15'));
    expect(typeof seed).toBe('string');
    expect(seed.length).toBe(64); // SHA-256 hex
  });

  it('produces same seed for same inputs', () => {
    const date = new Date('2026-01-15');
    const seed1 = createSeed('user-123', 'exercise-1', date);
    const seed2 = createSeed('user-123', 'exercise-1', date);
    expect(seed1).toBe(seed2);
  });

  it('produces different seeds for different users', () => {
    const date = new Date('2026-01-15');
    const seed1 = createSeed('user-1', 'exercise-1', date);
    const seed2 = createSeed('user-2', 'exercise-1', date);
    expect(seed1).not.toBe(seed2);
  });

  it('produces different seeds for different exercises', () => {
    const date = new Date('2026-01-15');
    const seed1 = createSeed('user-1', 'exercise-a', date);
    const seed2 = createSeed('user-1', 'exercise-b', date);
    expect(seed1).not.toBe(seed2);
  });

  it('produces different seeds for different dates', () => {
    const seed1 = createSeed('user-1', 'exercise-1', new Date('2026-01-15'));
    const seed2 = createSeed('user-1', 'exercise-1', new Date('2026-01-16'));
    expect(seed1).not.toBe(seed2);
  });

  it('uses only date portion (ignores time)', () => {
    const date1 = new Date('2026-01-15T09:00:00Z');
    const date2 = new Date('2026-01-15T18:30:00Z');
    const seed1 = createSeed('user-1', 'exercise-1', date1);
    const seed2 = createSeed('user-1', 'exercise-1', date2);
    expect(seed1).toBe(seed2);
  });
});
