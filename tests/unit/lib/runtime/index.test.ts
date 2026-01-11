// tests/unit/lib/runtime/index.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRuntimeForLanguage,
  RuntimeRegistry,
  getRuntime,
  registerRuntime,
  getPythonRuntime,
  getJavaScriptRuntime,
  PythonRuntime,
  JavaScriptRuntime,
  type LanguageRuntime,
  type ExecutionResult,
  type TokenCompareResult,
  type AstCompareResult,
  type AstCompareOptions,
} from '@/lib/runtime';
import { resetPythonRuntimeInstance } from '@/lib/runtime/python-runtime';
import { resetJavaScriptRuntimeInstance } from '@/lib/runtime/javascript-runtime';

describe('Runtime Index', () => {
  beforeEach(() => {
    // Reset singletons to ensure clean state between tests
    resetPythonRuntimeInstance();
    resetJavaScriptRuntimeInstance();
    RuntimeRegistry.clear();
  });

  describe('exports', () => {
    it('should export RuntimeRegistry and its functions', () => {
      expect(RuntimeRegistry).toBeDefined();
      expect(getRuntime).toBeDefined();
      expect(registerRuntime).toBeDefined();
    });

    it('should export runtime getters', () => {
      expect(getPythonRuntime).toBeDefined();
      expect(getJavaScriptRuntime).toBeDefined();
    });

    it('should export runtime classes', () => {
      expect(PythonRuntime).toBeDefined();
      expect(JavaScriptRuntime).toBeDefined();
    });

    it('should export types (checked via type usage)', () => {
      // Type assertions to verify exports compile correctly
      const execResult: ExecutionResult = {
        success: true,
        output: 'test',
        error: null,
      };
      expect(execResult.success).toBe(true);

      const tokenResult: TokenCompareResult = {
        match: true,
        matchedAlternative: null,
      };
      expect(tokenResult.match).toBe(true);

      const astResult: AstCompareResult = {
        match: false,
        matchedAlternative: null,
        infraAvailable: true,
      };
      expect(astResult.infraAvailable).toBe(true);

      const astOptions: AstCompareOptions = {
        renameLocals: true,
        normalizeSlices: false,
      };
      expect(astOptions.renameLocals).toBe(true);
      expect(astOptions.normalizeSlices).toBe(false);
    });
  });

  describe('getRuntimeForLanguage', () => {
    it('should get Python runtime', () => {
      const runtime = getRuntimeForLanguage('python');
      expect(runtime).toBeDefined();
      expect(runtime?.language).toBe('python');
      expect(runtime).toBeInstanceOf(PythonRuntime);
    });

    it('should get JavaScript runtime', () => {
      const runtime = getRuntimeForLanguage('javascript');
      expect(runtime).toBeDefined();
      expect(runtime?.language).toBe('javascript');
      expect(runtime).toBeInstanceOf(JavaScriptRuntime);
    });

    it('should return undefined for unknown language', () => {
      // TypeScript doesn't allow invalid languages at compile time,
      // but we test runtime behavior for safety
      const runtime = getRuntimeForLanguage('ruby' as any);
      expect(runtime).toBeUndefined();
    });

    it('should return undefined for typescript (not yet implemented)', () => {
      const runtime = getRuntimeForLanguage('typescript');
      expect(runtime).toBeUndefined();
    });

    it('should return undefined for sql (not yet implemented)', () => {
      const runtime = getRuntimeForLanguage('sql');
      expect(runtime).toBeUndefined();
    });

    it('should return same singleton instance on repeated calls', () => {
      const runtime1 = getRuntimeForLanguage('python');
      const runtime2 = getRuntimeForLanguage('python');
      expect(runtime1).toBe(runtime2);

      const jsRuntime1 = getRuntimeForLanguage('javascript');
      const jsRuntime2 = getRuntimeForLanguage('javascript');
      expect(jsRuntime1).toBe(jsRuntime2);
    });
  });

  describe('LanguageRuntime interface', () => {
    it('should return runtimes that implement LanguageRuntime interface', () => {
      const pyRuntime = getRuntimeForLanguage('python');
      expect(pyRuntime).toBeDefined();

      // Check all required properties/methods exist
      expect(pyRuntime!.language).toBe('python');
      expect(typeof pyRuntime!.initialize).toBe('function');
      expect(typeof pyRuntime!.isReady).toBe('function');
      expect(typeof pyRuntime!.execute).toBe('function');
      expect(typeof pyRuntime!.tokenize).toBe('function');
      expect(typeof pyRuntime!.compareByTokens).toBe('function');
      expect(typeof pyRuntime!.compareByAst).toBe('function');
      expect(typeof pyRuntime!.terminate).toBe('function');

      const jsRuntime = getRuntimeForLanguage('javascript');
      expect(jsRuntime).toBeDefined();
      expect(jsRuntime!.language).toBe('javascript');
      expect(typeof jsRuntime!.initialize).toBe('function');
      expect(typeof jsRuntime!.isReady).toBe('function');
      expect(typeof jsRuntime!.execute).toBe('function');
      expect(typeof jsRuntime!.tokenize).toBe('function');
      expect(typeof jsRuntime!.compareByTokens).toBe('function');
      expect(typeof jsRuntime!.compareByAst).toBe('function');
      expect(typeof jsRuntime!.terminate).toBe('function');
    });
  });
});
