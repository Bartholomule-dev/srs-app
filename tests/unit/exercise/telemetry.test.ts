// tests/unit/exercise/telemetry.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTelemetryEntry } from '@/lib/exercise/telemetry';
import type { GradingTelemetry } from '@/lib/exercise/telemetry';

describe('telemetry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('createTelemetryEntry', () => {
    it('creates entry with required fields', () => {
      const entry = createTelemetryEntry({
        exerciseSlug: 'test-exercise',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("hello")',
      });

      expect(entry.exerciseSlug).toBe('test-exercise');
      expect(entry.strategy).toBe('exact');
      expect(entry.wasCorrect).toBe(true);
      expect(entry.fallbackUsed).toBe(false);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('hashes user answer instead of storing raw', () => {
      const entry = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("secret")',
      });

      expect(entry.userAnswerHash).toBeDefined();
      expect(entry.userAnswerHash).not.toContain('secret');
      expect(entry.userAnswerHash.length).toBeGreaterThan(0);
    });

    it('includes optional fields when provided', () => {
      const entry = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'execution',
        wasCorrect: false,
        fallbackUsed: true,
        fallbackReason: 'pyodide_unavailable',
        matchedAlternative: 'alt1',
        userAnswer: 'code',
      });

      expect(entry.fallbackReason).toBe('pyodide_unavailable');
      expect(entry.matchedAlternative).toBe('alt1');
    });

    it('produces consistent hash for same input', () => {
      const entry1 = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("hello")',
      });

      const entry2 = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("hello")',
      });

      expect(entry1.userAnswerHash).toBe(entry2.userAnswerHash);
    });

    it('produces different hashes for different inputs', () => {
      const entry1 = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("hello")',
      });

      const entry2 = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("world")',
      });

      expect(entry1.userAnswerHash).not.toBe(entry2.userAnswerHash);
    });
  });

  describe('logGradingTelemetry', () => {
    it('logs to console in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      // Re-import to pick up stubbed env
      const { logGradingTelemetry } = await import('@/lib/exercise/telemetry');

      const entry: GradingTelemetry = {
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswerHash: 'abc123',
        timestamp: new Date(),
      };

      logGradingTelemetry(entry);

      expect(console.log).toHaveBeenCalledWith('[Grading]', entry);
    });

    it('does not log in production mode', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      // Re-import to pick up stubbed env
      const { logGradingTelemetry } = await import('@/lib/exercise/telemetry');

      const entry: GradingTelemetry = {
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswerHash: 'abc123',
        timestamp: new Date(),
      };

      logGradingTelemetry(entry);

      expect(console.log).not.toHaveBeenCalled();
    });
  });
});
