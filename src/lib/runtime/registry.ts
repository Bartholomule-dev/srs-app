// src/lib/runtime/registry.ts
import type { Language } from '@/lib/types';
import type { LanguageRuntime } from './types';

const runtimes = new Map<Language, LanguageRuntime>();

/**
 * Registry for language runtimes.
 *
 * **Thread Safety:** This registry is not thread-safe. All runtime registrations
 * should be performed synchronously during application startup before any
 * concurrent access occurs. The module-level Map is shared across all imports,
 * so registrations are global within the process.
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
