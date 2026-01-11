// src/lib/paths/client-loader.ts
//
// Client-safe path index loaders for React/browser contexts.
//
// Two approaches are provided:
// 1. getPathIndexSync() / getPathIndex() - Uses pre-generated JSON (Python only, instant)
// 2. getClientPathIndex(language) - Uses fetch API (any language, async)
//
// The pre-generated JSON is created by: pnpm generate:paths
// For multi-language support, use getClientPathIndex(language).

import type { Blueprint, Skin, PathIndex, BlueprintRef } from './types';

// Import the pre-generated JSON (Python only)
// This file is created by scripts/generate-path-index.ts
import generatedIndex from './generated/path-index.json';

interface SerializedPathIndex {
  blueprints: Record<string, Blueprint>;
  skins: Record<string, Skin>;
  exerciseToBlueprints: Record<string, BlueprintRef[]>;
  exerciseToSkins: Record<string, string[]>;
}

// Type assertion for the imported JSON
const serializedIndex = generatedIndex as SerializedPathIndex;

// Convert serialized index (objects) to PathIndex (Maps)
function deserializeIndex(serialized: SerializedPathIndex): PathIndex {
  return {
    blueprints: new Map(Object.entries(serialized.blueprints)),
    skins: new Map(Object.entries(serialized.skins)),
    exerciseToBlueprints: new Map(Object.entries(serialized.exerciseToBlueprints)),
    exerciseToSkins: new Map(Object.entries(serialized.exerciseToSkins)),
  };
}

// ============================================================================
// Pre-generated JSON approach (Python only, synchronous)
// ============================================================================

// Cached Python index from pre-generated JSON
let cachedPythonIndex: PathIndex | null = null;

/**
 * Get the Python path index (client-safe, synchronous).
 * Uses pre-generated JSON data - loads instantly.
 *
 * NOTE: This only supports Python. For other languages, use getClientPathIndex().
 */
export function getPathIndexSync(): PathIndex {
  if (!cachedPythonIndex) {
    cachedPythonIndex = deserializeIndex(serializedIndex);
  }
  return cachedPythonIndex;
}

/**
 * Get the Python path index (async version for API compatibility).
 * Returns immediately since data is pre-loaded.
 *
 * NOTE: This only supports Python. For other languages, use getClientPathIndex().
 */
export async function getPathIndex(): Promise<PathIndex> {
  return getPathIndexSync();
}

// ============================================================================
// Fetch-based approach (any language, async)
// ============================================================================

// Per-language cache for fetched indexes
const fetchedIndexCache = new Map<string, PathIndex>();

// Track in-flight requests to avoid duplicate fetches
const pendingFetches = new Map<string, Promise<PathIndex>>();

/**
 * Get the path index for a specific language via API.
 * Fetches from /api/paths and caches the result.
 *
 * @param language - 'python' or 'javascript' (default: 'python')
 * @returns Promise resolving to PathIndex
 * @throws Error if fetch fails
 *
 * @example
 * ```tsx
 * const index = await getClientPathIndex('javascript');
 * const blueprint = index.blueprints.get('my-blueprint');
 * ```
 */
export async function getClientPathIndex(language: string = 'python'): Promise<PathIndex> {
  // For Python, prefer the pre-generated JSON (faster, no network)
  if (language === 'python' && cachedPythonIndex) {
    return cachedPythonIndex;
  }

  // Check cache
  if (fetchedIndexCache.has(language)) {
    return fetchedIndexCache.get(language)!;
  }

  // Check if there's already a pending fetch for this language
  if (pendingFetches.has(language)) {
    return pendingFetches.get(language)!;
  }

  // Create the fetch promise
  const fetchPromise = (async () => {
    const response = await fetch(`/api/paths?language=${encodeURIComponent(language)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to load paths: ${response.statusText}`);
    }

    const serialized: SerializedPathIndex = await response.json();
    const index = deserializeIndex(serialized);

    // Cache the result
    fetchedIndexCache.set(language, index);

    // Clean up pending fetch
    pendingFetches.delete(language);

    return index;
  })();

  // Store the pending promise
  pendingFetches.set(language, fetchPromise);

  return fetchPromise;
}

// ============================================================================
// Cache management
// ============================================================================

/**
 * Clear cached path indexes.
 *
 * @param language - If specified, only clear cache for that language.
 *                   If omitted, clear all caches (both pre-generated and fetched).
 */
export function clearPathIndexCache(language?: string): void {
  if (language) {
    if (language === 'python') {
      cachedPythonIndex = null;
    }
    fetchedIndexCache.delete(language);
    pendingFetches.delete(language);
  } else {
    // Clear all
    cachedPythonIndex = null;
    fetchedIndexCache.clear();
    pendingFetches.clear();
  }
}
