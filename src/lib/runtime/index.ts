// src/lib/runtime/index.ts
// Central entry point for the runtime system.
// Provides clean barrel exports and a unified API for getting language runtimes.

// Export types
export type {
  LanguageRuntime,
  ExecutionResult,
  TokenCompareResult,
  AstCompareResult,
  AstCompareOptions,
} from './types';

// Export registry
export { RuntimeRegistry, getRuntime, registerRuntime } from './registry';

// Export Python runtime
export { PythonRuntime, getPythonRuntime, resetPythonRuntimeInstance } from './python-runtime';

// Export JavaScript runtime
export {
  JavaScriptRuntime,
  getJavaScriptRuntime,
  resetJavaScriptRuntimeInstance,
} from './javascript-runtime';

// Import types for the getRuntimeForLanguage function
import type { Language } from '@/lib/types';
import type { LanguageRuntime } from './types';
import { getPythonRuntime } from './python-runtime';
import { getJavaScriptRuntime } from './javascript-runtime';

/**
 * Get the appropriate runtime for a language.
 * Returns the singleton instance for supported languages, or undefined if
 * no runtime is available for the language.
 *
 * Currently supported:
 * - python: PythonRuntime (Pyodide-based)
 * - javascript: JavaScriptRuntime (Web Worker + Acorn)
 *
 * Not yet implemented:
 * - typescript
 * - sql
 *
 * @param language - The language to get a runtime for
 * @returns The language runtime instance, or undefined if not supported
 */
export function getRuntimeForLanguage(language: Language): LanguageRuntime | undefined {
  switch (language) {
    case 'python':
      return getPythonRuntime();
    case 'javascript':
      return getJavaScriptRuntime();
    default:
      // typescript, sql, and any future languages not yet implemented
      return undefined;
  }
}
