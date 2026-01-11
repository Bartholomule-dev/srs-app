// Server-only module - uses Node.js fs
// For client-side code, use client-loader.ts instead
import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import type { Blueprint, Skin, PathIndex, BlueprintRef } from './types';

/**
 * Get the paths directory for a specific language
 */
function getPathsDir(language: string = 'python'): string {
  return join(process.cwd(), 'paths', language);
}

/**
 * Load all blueprints from YAML files for a specific language
 */
export async function loadBlueprints(language: string = 'python'): Promise<Blueprint[]> {
  const blueprintsDir = join(getPathsDir(language), 'blueprints');

  try {
    await access(blueprintsDir);
  } catch {
    return []; // Directory doesn't exist for this language yet
  }

  const files = await readdir(blueprintsDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const blueprints: Blueprint[] = [];

  for (const file of yamlFiles) {
    const content = await readFile(join(blueprintsDir, file), 'utf-8');
    const data = yaml.load(content) as Blueprint;

    // Basic validation
    if (!data.id || !data.title || !data.beats || data.beats.length === 0) {
      console.warn(`Invalid blueprint in ${file}: missing required fields`);
      continue;
    }

    blueprints.push(data);
  }

  return blueprints;
}

/**
 * Load all skins from YAML files for a specific language
 */
export async function loadSkins(language: string = 'python'): Promise<Skin[]> {
  const skinsDir = join(getPathsDir(language), 'skins');

  try {
    await access(skinsDir);
  } catch {
    return []; // Directory doesn't exist for this language yet
  }

  const files = await readdir(skinsDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const skins: Skin[] = [];

  for (const file of yamlFiles) {
    const content = await readFile(join(skinsDir, file), 'utf-8');
    const data = yaml.load(content) as Skin;

    // Basic validation - blueprints is optional for global skins
    if (!data.id || !data.title || !data.vars) {
      console.warn(`Invalid skin in ${file}: missing required fields`);
      continue;
    }

    skins.push(data);
  }

  return skins;
}

/**
 * Build lookup indexes for efficient querying
 */
export function buildPathIndex(blueprints: Blueprint[], skins: Skin[]): PathIndex {
  const index: PathIndex = {
    blueprints: new Map(),
    skins: new Map(),
    exerciseToBlueprints: new Map(),
    exerciseToSkins: new Map(),
  };

  // Index blueprints
  for (const bp of blueprints) {
    index.blueprints.set(bp.id, bp);

    // Map exercises to blueprint refs
    for (const beat of bp.beats) {
      // Index main exercise
      const existing = index.exerciseToBlueprints.get(beat.exercise) ?? [];
      existing.push({
        blueprintId: bp.id,
        beat: beat.beat,
        totalBeats: bp.beats.length,
        beatTitle: beat.title,
      });
      index.exerciseToBlueprints.set(beat.exercise, existing);

      // Index side-quest exercises (same beat context)
      if (beat.sideQuests) {
        for (const sideQuestSlug of beat.sideQuests) {
          const sqExisting = index.exerciseToBlueprints.get(sideQuestSlug) ?? [];
          sqExisting.push({
            blueprintId: bp.id,
            beat: beat.beat,
            totalBeats: bp.beats.length,
            beatTitle: beat.title,
          });
          index.exerciseToBlueprints.set(sideQuestSlug, sqExisting);
        }
      }
    }
  }

  // Index skins
  for (const skin of skins) {
    index.skins.set(skin.id, skin);

    // Map exercises to compatible skins
    // A skin is compatible with an exercise if:
    // - It's a global skin (no blueprints specified) - compatible with all exercises
    // - It's in a blueprint the skin supports
    if (skin.blueprints) {
      // Blueprint-restricted skin
      for (const bpId of skin.blueprints) {
        const bp = index.blueprints.get(bpId);
        if (!bp) continue;

        for (const beat of bp.beats) {
          // Index main exercise
          const existing = index.exerciseToSkins.get(beat.exercise) ?? [];
          if (!existing.includes(skin.id)) {
            existing.push(skin.id);
          }
          index.exerciseToSkins.set(beat.exercise, existing);

          // Index side-quest exercises
          if (beat.sideQuests) {
            for (const sideQuestSlug of beat.sideQuests) {
              const sqExisting = index.exerciseToSkins.get(sideQuestSlug) ?? [];
              if (!sqExisting.includes(skin.id)) {
                sqExisting.push(skin.id);
              }
              index.exerciseToSkins.set(sideQuestSlug, sqExisting);
            }
          }
        }
      }
    }
    // Note: Global skins (no blueprints) are handled at lookup time,
    // not during indexing, to avoid inflating the index with every exercise
  }

  return index;
}

// Per-language index cache
const cachedIndexes = new Map<string, PathIndex>();

/**
 * Get the path index for a specific language (loads and caches on first call)
 */
export async function getPathIndex(language: string = 'python'): Promise<PathIndex> {
  if (cachedIndexes.has(language)) {
    return cachedIndexes.get(language)!;
  }

  const blueprints = await loadBlueprints(language);
  const skins = await loadSkins(language);
  const index = buildPathIndex(blueprints, skins);
  cachedIndexes.set(language, index);

  return index;
}

/**
 * Clear the cached index (useful for testing)
 * @param language - If specified, only clear cache for that language. If omitted, clear all caches.
 */
export function clearPathIndexCache(language?: string): void {
  if (language) {
    cachedIndexes.delete(language);
  } else {
    cachedIndexes.clear();
  }
}
