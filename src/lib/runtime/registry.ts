// src/lib/runtime/registry.ts
import type { Language } from '@/lib/types';
import type { LanguageRuntime } from './types';

const runtimes = new Map<Language, LanguageRuntime>();

/**
 * Registry for language runtimes.
 */
export const RuntimeRegistry = {
  get(language: Language): LanguageRuntime | undefined {
    return runtimes.get(language);
  },

  set(runtime: LanguageRuntime): void {
    if (runtimes.has(runtime.language)) {
      throw new Error(`Runtime already registered for ${runtime.language}`);
    }
    runtimes.set(runtime.language, runtime);
  },

  clear(): void {
    // Terminate all runtimes before clearing
    for (const runtime of runtimes.values()) {
      runtime.terminate();
    }
    runtimes.clear();
  },

  has(language: Language): boolean {
    return runtimes.has(language);
  },
};

/**
 * Get runtime for a language.
 */
export function getRuntime(language: Language): LanguageRuntime | undefined {
  return RuntimeRegistry.get(language);
}

/**
 * Register a runtime for a language.
 */
export function registerRuntime(runtime: LanguageRuntime): void {
  RuntimeRegistry.set(runtime);
}
