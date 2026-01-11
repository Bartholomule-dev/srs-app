// tests/unit/lib/runtime/javascript-runtime.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  JavaScriptRuntime,
  getJavaScriptRuntime,
  resetJavaScriptRuntimeInstance,
} from '@/lib/runtime/javascript-runtime';

// Mock the worker manager module
vi.mock('@/lib/runtime/javascript-worker', () => ({
  getJavaScriptWorkerManager: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    execute: vi.fn().mockResolvedValue({ success: true, output: 'test output', error: null }),
    terminate: vi.fn(),
  })),
  resetJavaScriptWorkerManagerInstance: vi.fn(),
}));

// Mock the AST module
vi.mock('@/lib/runtime/javascript-ast', () => ({
  tokenizeJavaScript: vi.fn().mockReturnValue([['const', 'const'], ['name', 'x'], ['=', '='], ['num', '1']]),
  compareByTokens: vi.fn().mockReturnValue({ match: true, matchedAlternative: null }),
  compareByAst: vi.fn().mockReturnValue({ match: true, matchedAlternative: null, infraAvailable: true }),
}));

describe('JavaScriptRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetJavaScriptRuntimeInstance();
  });

  afterEach(() => {
    resetJavaScriptRuntimeInstance();
  });

  describe('basic properties', () => {
    it('should have language set to javascript', () => {
      const runtime = new JavaScriptRuntime();
      expect(runtime.language).toBe('javascript');
    });

    it('should not be ready before initialization', () => {
      const runtime = new JavaScriptRuntime();
      expect(runtime.isReady()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize the worker manager', async () => {
      const { getJavaScriptWorkerManager } = await import('@/lib/runtime/javascript-worker');
      const runtime = new JavaScriptRuntime();

      await runtime.initialize();

      expect(getJavaScriptWorkerManager).toHaveBeenCalled();
      expect(runtime.isReady()).toBe(true);
    });

    it('should be idempotent - calling initialize twice should not reinitialize', async () => {
      const runtime = new JavaScriptRuntime();

      await runtime.initialize();
      await runtime.initialize();

      // Should still be ready after double init
      expect(runtime.isReady()).toBe(true);
    });
  });

  describe('execute', () => {
    it('should return error if runtime not initialized', async () => {
      const runtime = new JavaScriptRuntime();

      const result = await runtime.execute('console.log("hello")');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Runtime not initialized');
    });

    it('should delegate execution to worker manager', async () => {
      const runtime = new JavaScriptRuntime();
      await runtime.initialize();

      const result = await runtime.execute('console.log("hello")');

      expect(result.success).toBe(true);
      expect(result.output).toBe('test output');
    });
  });

  describe('tokenize', () => {
    it('should delegate to tokenizeJavaScript', async () => {
      const { tokenizeJavaScript } = await import('@/lib/runtime/javascript-ast');
      const runtime = new JavaScriptRuntime();

      const result = await runtime.tokenize('const x = 1');

      expect(tokenizeJavaScript).toHaveBeenCalledWith('const x = 1');
      expect(result).toEqual([['const', 'const'], ['name', 'x'], ['=', '='], ['num', '1']]);
    });
  });

  describe('compareByTokens', () => {
    it('should delegate to compareByTokens from javascript-ast', async () => {
      const { compareByTokens } = await import('@/lib/runtime/javascript-ast');
      const runtime = new JavaScriptRuntime();

      const result = await runtime.compareByTokens('const x = 1', 'const x = 1', ['const x=1']);

      expect(compareByTokens).toHaveBeenCalledWith('const x = 1', 'const x = 1', ['const x=1']);
      expect(result.match).toBe(true);
    });
  });

  describe('compareByAst', () => {
    it('should delegate to compareByAst from javascript-ast', async () => {
      const { compareByAst } = await import('@/lib/runtime/javascript-ast');
      const runtime = new JavaScriptRuntime();

      const result = await runtime.compareByAst('const x = 1', 'const x = 1', ['const x=1'], {});

      expect(compareByAst).toHaveBeenCalledWith('const x = 1', 'const x = 1', ['const x=1'], {});
      expect(result.match).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });
  });

  describe('terminate', () => {
    it('should clean up resources', async () => {
      const runtime = new JavaScriptRuntime();
      await runtime.initialize();

      expect(runtime.isReady()).toBe(true);

      runtime.terminate();

      expect(runtime.isReady()).toBe(false);
    });

    it('should be safe to call terminate without initialization', () => {
      const runtime = new JavaScriptRuntime();

      // Should not throw
      expect(() => runtime.terminate()).not.toThrow();
    });
  });

  describe('singleton', () => {
    it('should return the same instance from getJavaScriptRuntime', () => {
      const runtime1 = getJavaScriptRuntime();
      const runtime2 = getJavaScriptRuntime();

      expect(runtime1).toBe(runtime2);
    });

    it('should return a new instance after reset', () => {
      const runtime1 = getJavaScriptRuntime();
      resetJavaScriptRuntimeInstance();
      const runtime2 = getJavaScriptRuntime();

      expect(runtime1).not.toBe(runtime2);
    });
  });
});

// Integration tests (without mocks) to verify real tokenization and comparison
// These tests import the real javascript-ast module directly
describe('JavaScriptRuntime integration', () => {
  describe('tokenization (real)', () => {
    it('should tokenize valid JavaScript', async () => {
      // Import the real AST module directly
      const { tokenizeJavaScript } = await vi.importActual<
        typeof import('@/lib/runtime/javascript-ast')
      >('@/lib/runtime/javascript-ast');

      const tokens = tokenizeJavaScript('const x = 1');

      expect(tokens).not.toBeNull();
      expect(tokens!.length).toBeGreaterThan(0);
    });

    it('should return null for invalid syntax', async () => {
      // Import the real AST module directly
      const { tokenizeJavaScript } = await vi.importActual<
        typeof import('@/lib/runtime/javascript-ast')
      >('@/lib/runtime/javascript-ast');

      const tokens = tokenizeJavaScript('function {');

      expect(tokens).toBeNull();
    });
  });

  describe('comparison (real)', () => {
    it('should compare by tokens', async () => {
      // Import the real AST module directly
      const { compareByTokens: realCompareByTokens } = await vi.importActual<
        typeof import('@/lib/runtime/javascript-ast')
      >('@/lib/runtime/javascript-ast');

      const result = realCompareByTokens('const x = 1', 'const x=1');

      expect(result.match).toBe(true);
    });

    it('should compare by AST', async () => {
      // Import the real AST module directly
      const { compareByAst: realCompareByAst } = await vi.importActual<
        typeof import('@/lib/runtime/javascript-ast')
      >('@/lib/runtime/javascript-ast');

      const result = realCompareByAst('const x = 1;', 'const x = 1');

      expect(result.match).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });
  });
});
