// tests/unit/lib/runtime/registry.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RuntimeRegistry, getRuntime, registerRuntime } from '@/lib/runtime/registry';
import type { LanguageRuntime } from '@/lib/runtime/types';

describe('RuntimeRegistry', () => {
  beforeEach(() => {
    RuntimeRegistry.clear();
  });

  it('should register and retrieve a runtime', () => {
    const mockRuntime: LanguageRuntime = {
      language: 'python',
      initialize: async () => {},
      isReady: () => true,
      execute: async () => ({ success: true, output: '', error: null }),
      tokenize: async () => [],
      compareByTokens: async () => ({ match: false, matchedAlternative: null }),
      compareByAst: async () => ({ match: false, matchedAlternative: null, infraAvailable: true }),
      terminate: () => {},
    };

    registerRuntime(mockRuntime);
    expect(getRuntime('python')).toBe(mockRuntime);
  });

  it('should return undefined for unregistered language', () => {
    expect(getRuntime('javascript')).toBeUndefined();
  });

  it('should throw if registering duplicate language', () => {
    const mockRuntime: LanguageRuntime = {
      language: 'python',
      initialize: async () => {},
      isReady: () => true,
      execute: async () => ({ success: true, output: '', error: null }),
      tokenize: async () => [],
      compareByTokens: async () => ({ match: false, matchedAlternative: null }),
      compareByAst: async () => ({ match: false, matchedAlternative: null, infraAvailable: true }),
      terminate: () => {},
    };

    registerRuntime(mockRuntime);
    expect(() => registerRuntime(mockRuntime)).toThrow();
  });

  it('should check if runtime exists with has()', () => {
    expect(RuntimeRegistry.has('python')).toBe(false);
    const mockRuntime: LanguageRuntime = {
      language: 'python',
      initialize: async () => {},
      isReady: () => true,
      execute: async () => ({ success: true, output: '', error: null }),
      tokenize: async () => [],
      compareByTokens: async () => ({ match: false, matchedAlternative: null }),
      compareByAst: async () => ({ match: false, matchedAlternative: null, infraAvailable: true }),
      terminate: () => {},
    };
    registerRuntime(mockRuntime);
    expect(RuntimeRegistry.has('python')).toBe(true);
  });

  it('should terminate all runtimes when clearing', () => {
    const mockRuntime1: LanguageRuntime = {
      language: 'python',
      initialize: async () => {},
      isReady: () => true,
      execute: async () => ({ success: true, output: '', error: null }),
      tokenize: async () => [],
      compareByTokens: async () => ({ match: false, matchedAlternative: null }),
      compareByAst: async () => ({ match: false, matchedAlternative: null, infraAvailable: true }),
      terminate: vi.fn(),
    };
    const mockRuntime2: LanguageRuntime = {
      language: 'javascript',
      initialize: async () => {},
      isReady: () => true,
      execute: async () => ({ success: true, output: '', error: null }),
      tokenize: async () => [],
      compareByTokens: async () => ({ match: false, matchedAlternative: null }),
      compareByAst: async () => ({ match: false, matchedAlternative: null, infraAvailable: true }),
      terminate: vi.fn(),
    };

    registerRuntime(mockRuntime1);
    registerRuntime(mockRuntime2);
    RuntimeRegistry.clear();

    expect(mockRuntime1.terminate).toHaveBeenCalled();
    expect(mockRuntime2.terminate).toHaveBeenCalled();
  });
});
