// src/lib/generators/index.ts
// Generator registry and public API with language-scoped routing

import type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata, VariantOverrides, VariantMap } from './types';
import * as pythonGenerators from './python';
import * as javascriptGenerators from './javascript';

// Re-export types
export type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata, VariantOverrides, VariantMap };

// Re-export utilities
export { createSeed, hashString } from './seed';
export { seededRandom, type SeededRandom } from './utils';

/**
 * Supported languages for generators.
 */
export type SupportedLanguage = 'python' | 'javascript';

/**
 * Language module interface.
 */
interface LanguageGeneratorModule {
  generators: Map<string, Generator>;
  getGenerator(name: string): Generator | undefined;
  hasGenerator(name: string): boolean;
  getGeneratorNames(): string[];
}

/**
 * Registry of generator modules by language.
 */
const generatorsByLanguage: Record<SupportedLanguage, LanguageGeneratorModule> = {
  python: pythonGenerators,
  javascript: javascriptGenerators,
};

/**
 * Get a generator by name, optionally scoped to a language.
 * Defaults to Python for backward compatibility.
 *
 * @param name - Generator name (e.g., 'slice-bounds')
 * @param language - Target language (defaults to 'python')
 * @returns Generator instance or undefined if not found
 */
export function getGenerator(name: string, language: SupportedLanguage = 'python'): Generator | undefined {
  return generatorsByLanguage[language]?.getGenerator(name);
}

/**
 * Check if a generator exists, optionally scoped to a language.
 * Defaults to Python for backward compatibility.
 *
 * @param name - Generator name (e.g., 'slice-bounds')
 * @param language - Target language (defaults to 'python')
 * @returns true if generator exists for the given language
 */
export function hasGenerator(name: string, language: SupportedLanguage = 'python'): boolean {
  return generatorsByLanguage[language]?.hasGenerator(name) ?? false;
}

/**
 * Get all registered generator names for a language.
 * Defaults to Python for backward compatibility.
 *
 * @param language - Target language (defaults to 'python')
 * @returns Array of generator names
 */
export function getGeneratorNames(language: SupportedLanguage = 'python'): string[] {
  return generatorsByLanguage[language]?.getGeneratorNames() ?? [];
}

/**
 * Get list of supported languages.
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(generatorsByLanguage) as SupportedLanguage[];
}

/**
 * Register a generator for a specific language.
 * Used for dynamically adding generators at runtime.
 *
 * @param generator - Generator instance to register
 * @param language - Target language (defaults to 'python')
 */
export function registerGenerator(generator: Generator, language: SupportedLanguage = 'python'): void {
  generatorsByLanguage[language]?.generators.set(generator.name, generator);
}
