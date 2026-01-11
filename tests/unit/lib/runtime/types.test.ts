// tests/unit/lib/runtime/types.test.ts
import { describe, it, expect } from 'vitest';
import type {
  LanguageRuntime,
  ExecutionResult,
  TokenCompareResult,
  AstCompareResult,
} from '@/lib/runtime/types';

describe('LanguageRuntime interface', () => {
  it('should define expected shape', () => {
    // Type-level test - if this compiles, the interface exists
    const mockRuntime: LanguageRuntime = {
      language: 'javascript',
      initialize: async () => {},
      isReady: () => true,
      execute: async () => ({ success: true, output: '', error: null }),
      tokenize: async () => [[0, 'token']],
      compareByTokens: async () => ({ match: true, matchedAlternative: null }),
      compareByAst: async () => ({
        match: true,
        matchedAlternative: null,
        infraAvailable: true,
      }),
      terminate: () => {},
    };
    expect(mockRuntime.language).toBe('javascript');
  });

  it('should allow ExecutionResult with error', () => {
    const errorResult: ExecutionResult = {
      success: false,
      output: null,
      error: 'SyntaxError: Unexpected token',
    };
    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBeTruthy();
  });

  it('should allow TokenCompareResult with matched alternative', () => {
    const result: TokenCompareResult = {
      match: true,
      matchedAlternative: 'x = [1, 2, 3]',
    };
    expect(result.match).toBe(true);
    expect(result.matchedAlternative).toBe('x = [1, 2, 3]');
  });

  it('should allow AstCompareResult with error', () => {
    const result: AstCompareResult = {
      match: false,
      matchedAlternative: null,
      infraAvailable: false,
      error: 'AST parsing not available',
    };
    expect(result.infraAvailable).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
