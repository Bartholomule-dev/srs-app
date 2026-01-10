// tests/unit/exercise/token-compare.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { compareByTokens, tokenizeCode, resetTokenizer } from '@/lib/exercise/token-compare';
import { createMockPyodide } from '@tests/fixtures/pyodide';

describe('token-compare', () => {
  beforeEach(() => {
    resetTokenizer();
  });

  describe('tokenizeCode', () => {
    it('returns token array for valid code', async () => {
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return ''; // initTokenizer call
          return '[[1, "x"], [54, "="], [2, "1"]]';
        },
      });

      const tokens = await tokenizeCode(mockPyodide, 'x = 1');
      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
    });

    it('returns null for invalid/untokenizable code', async () => {
      const mockPyodide = createMockPyodide({
        runPythonFn: () => null,
      });

      const tokens = await tokenizeCode(mockPyodide, 'invalid');
      expect(tokens).toBeNull();
    });
  });

  describe('compareByTokens - whitespace tolerance', () => {
    it('matches code with different whitespace', async () => {
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return '';
          return '[[1, "x"], [54, "="], [2, "1"]]';
        },
      });

      const result = await compareByTokens(mockPyodide, 'x=1', 'x = 1', []);
      expect(result.match).toBe(true);
    });

    it('matches code with different comments', async () => {
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return '';
          return '[[1, "x"], [54, "="], [2, "1"]]';
        },
      });

      const result = await compareByTokens(mockPyodide, 'x = 1  # comment', 'x = 1', []);
      expect(result.match).toBe(true);
    });

    it('does NOT match different slice notation (limitation)', async () => {
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return '';
          if (callCount === 2) return '[[1, "items"], [54, "["], [54, ":"], [2, "3"], [54, "]"]]';
          return '[[1, "items"], [54, "["], [2, "0"], [54, ":"], [2, "3"], [54, "]"]]';
        },
      });

      const result = await compareByTokens(mockPyodide, 'items[:3]', 'items[0:3]', []);
      expect(result.match).toBe(false);
    });

    it('matches against accepted alternatives', async () => {
      let idx = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          const responses = ['', '[[1, "a"]]', '[[1, "b"]]', '[[1, "a"]]'];
          return responses[idx++];
        },
      });

      const result = await compareByTokens(mockPyodide, 'a', 'b', ['a']);
      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBe('a');
    });

    it('returns false when no match', async () => {
      let idx = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          const responses = ['', '[[1, "a"]]', '[[1, "b"]]', '[[1, "c"]]'];
          return responses[idx++];
        },
      });

      const result = await compareByTokens(mockPyodide, 'a', 'b', ['c']);
      expect(result.match).toBe(false);
      expect(result.matchedAlternative).toBeNull();
    });

    it('handles pyodide errors gracefully', async () => {
      const mockPyodide = createMockPyodide({
        error: new Error('Tokenize failed'),
      });

      const result = await compareByTokens(mockPyodide, 'code', 'expected', []);
      expect(result.match).toBe(false);
    });
  });
});
