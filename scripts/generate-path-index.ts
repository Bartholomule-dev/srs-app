#!/usr/bin/env npx tsx
// scripts/generate-path-index.ts
//
// Generates a static JSON file containing the path index (blueprints, skins, lookup maps).
// This allows client-side code to use the path index without Node.js fs dependencies.
//
// Usage: pnpm generate:paths

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

// Types matching src/lib/paths/types.ts
interface Beat {
  beat: number;
  exercise: string;
  title: string;
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concepts: string[];
  beats: Beat[];
}

interface SkinVars {
  list_name: string;
  item_singular: string;
  item_plural: string;
  item_examples: string[];
  record_keys: string[];
  [key: string]: string | string[];
}

interface SkinDataPack {
  list_sample: (string | number | boolean)[];
  dict_sample: Record<string, string | number | boolean>;
  records_sample: Record<string, string | number | boolean>[];
  string_samples: string[];
}

interface Skin {
  id: string;
  title: string;
  icon: string;
  blueprints?: string[];
  vars: SkinVars;
  contexts: Record<string, string>;
  dataPack?: SkinDataPack;
}

interface BlueprintRef {
  blueprintId: string;
  beat: number;
  totalBeats: number;
  beatTitle: string;
}

// Serializable version of PathIndex (uses objects instead of Maps)
interface SerializedPathIndex {
  blueprints: Record<string, Blueprint>;
  skins: Record<string, Skin>;
  exerciseToBlueprints: Record<string, BlueprintRef[]>;
  exerciseToSkins: Record<string, string[]>;
}

const PATHS_DIR = join(process.cwd(), 'paths', 'python');
const BLUEPRINTS_DIR = join(PATHS_DIR, 'blueprints');
const SKINS_DIR = join(PATHS_DIR, 'skins');
const OUTPUT_DIR = join(process.cwd(), 'src', 'lib', 'paths', 'generated');
const OUTPUT_FILE = join(OUTPUT_DIR, 'path-index.json');

async function loadBlueprints(): Promise<Blueprint[]> {
  try {
    const files = await readdir(BLUEPRINTS_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    const blueprints: Blueprint[] = [];

    for (const file of yamlFiles) {
      const content = await readFile(join(BLUEPRINTS_DIR, file), 'utf-8');
      const data = yaml.load(content) as Blueprint;

      if (!data.id || !data.title || !data.beats || data.beats.length === 0) {
        console.warn(`  Warning: Invalid blueprint in ${file}: missing required fields`);
        continue;
      }

      blueprints.push(data);
    }

    return blueprints;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`  Warning: Blueprints directory not found: ${BLUEPRINTS_DIR}`);
      return [];
    }
    throw err;
  }
}

async function loadSkins(): Promise<Skin[]> {
  try {
    const files = await readdir(SKINS_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    const skins: Skin[] = [];

    for (const file of yamlFiles) {
      const content = await readFile(join(SKINS_DIR, file), 'utf-8');
      const data = yaml.load(content) as Skin;

      // blueprints is optional for global skins
      if (!data.id || !data.title || !data.vars) {
        console.warn(`  Warning: Invalid skin in ${file}: missing required fields`);
        continue;
      }

      skins.push(data);
    }

    return skins;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`  Warning: Skins directory not found: ${SKINS_DIR}`);
      return [];
    }
    throw err;
  }
}

function buildSerializedIndex(blueprints: Blueprint[], skins: Skin[]): SerializedPathIndex {
  const index: SerializedPathIndex = {
    blueprints: {},
    skins: {},
    exerciseToBlueprints: {},
    exerciseToSkins: {},
  };

  // Index blueprints
  for (const bp of blueprints) {
    index.blueprints[bp.id] = bp;

    // Map exercises to blueprint refs
    for (const beat of bp.beats) {
      if (!index.exerciseToBlueprints[beat.exercise]) {
        index.exerciseToBlueprints[beat.exercise] = [];
      }
      index.exerciseToBlueprints[beat.exercise].push({
        blueprintId: bp.id,
        beat: beat.beat,
        totalBeats: bp.beats.length,
        beatTitle: beat.title,
      });
    }
  }

  // Index skins
  for (const skin of skins) {
    index.skins[skin.id] = skin;

    // Map exercises to compatible skins
    // Blueprint-restricted skins only apply to exercises in those blueprints
    // Global skins (no blueprints) are handled at lookup time, not during indexing
    if (skin.blueprints) {
      for (const bpId of skin.blueprints) {
        const bp = index.blueprints[bpId];
        if (!bp) continue;

        for (const beat of bp.beats) {
          if (!index.exerciseToSkins[beat.exercise]) {
            index.exerciseToSkins[beat.exercise] = [];
          }
          if (!index.exerciseToSkins[beat.exercise].includes(skin.id)) {
            index.exerciseToSkins[beat.exercise].push(skin.id);
          }
        }
      }
    }
    // Note: Global skins (no blueprints) are handled at lookup time,
    // not during indexing, to avoid inflating the index with every exercise
  }

  return index;
}

async function main() {
  console.log('Generating path index...');

  const blueprints = await loadBlueprints();
  console.log(`  Loaded ${blueprints.length} blueprint(s)`);

  const skins = await loadSkins();
  console.log(`  Loaded ${skins.length} skin(s)`);

  const index = buildSerializedIndex(blueprints, skins);

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Write JSON file
  await writeFile(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`  Written to ${OUTPUT_FILE}`);

  // Summary
  const exerciseCount = Object.keys(index.exerciseToBlueprints).length;
  console.log(`  Indexed ${exerciseCount} exercise(s) across blueprints`);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error generating path index:', err);
  process.exit(1);
});
