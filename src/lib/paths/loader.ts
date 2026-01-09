// Server-only module - uses Node.js fs
// For client-side code, use client-loader.ts instead
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import type { Blueprint, Skin, PathIndex, BlueprintRef } from './types';

// Path to YAML files (relative to project root)
const PATHS_DIR = join(process.cwd(), 'paths', 'python');
const BLUEPRINTS_DIR = join(PATHS_DIR, 'blueprints');
const SKINS_DIR = join(PATHS_DIR, 'skins');

/**
 * Load all blueprints from YAML files
 */
export async function loadBlueprints(): Promise<Blueprint[]> {
  const files = await readdir(BLUEPRINTS_DIR);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const blueprints: Blueprint[] = [];

  for (const file of yamlFiles) {
    const content = await readFile(join(BLUEPRINTS_DIR, file), 'utf-8');
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
 * Load all skins from YAML files
 */
export async function loadSkins(): Promise<Skin[]> {
  const files = await readdir(SKINS_DIR);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const skins: Skin[] = [];

  for (const file of yamlFiles) {
    const content = await readFile(join(SKINS_DIR, file), 'utf-8');
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

// Singleton index cache
let cachedIndex: PathIndex | null = null;

/**
 * Get the path index (loads and caches on first call)
 */
export async function getPathIndex(): Promise<PathIndex> {
  if (cachedIndex) {
    return cachedIndex;
  }

  const blueprints = await loadBlueprints();
  const skins = await loadSkins();
  cachedIndex = buildPathIndex(blueprints, skins);

  return cachedIndex;
}

/**
 * Clear the cached index (useful for testing)
 */
export function clearPathIndexCache(): void {
  cachedIndex = null;
}
