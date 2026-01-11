// tests/unit/lib/runtime/registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
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
});
