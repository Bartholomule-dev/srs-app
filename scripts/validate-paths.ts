// scripts/validate-paths.ts
// Validates blueprint and skin YAML files for the path system
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import { loadBlueprints, loadSkins } from '../src/lib/paths/loader';

const EXERCISES_DIR = join(process.cwd(), 'exercises', 'python');

interface ExerciseEntry {
  slug: string;
  [key: string]: unknown;
}

interface ExerciseFile {
  exercises: ExerciseEntry[];
}

/**
 * Load all exercise slugs from the exercises YAML files
 */
async function loadExerciseSlugs(): Promise<Set<string>> {
  const slugs = new Set<string>();

  try {
    const files = await readdir(EXERCISES_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of yamlFiles) {
      const content = await readFile(join(EXERCISES_DIR, file), 'utf-8');
      const data = yaml.load(content) as ExerciseFile;

      if (data?.exercises && Array.isArray(data.exercises)) {
        for (const ex of data.exercises) {
          if (ex.slug) {
            slugs.add(ex.slug);
          }
        }
      }
    }
  } catch (err) {
    console.warn('  ⚠ Could not load exercises for validation:', (err as Error).message);
  }

  return slugs;
}

async function main() {
  console.log('Validating paths...\n');

  let errors = 0;

  try {
    // Load exercise slugs for validation
    const exerciseSlugs = await loadExerciseSlugs();
    console.log(`✓ Loaded ${exerciseSlugs.size} exercise slugs for validation`);

    // Load and validate blueprints
    const blueprints = await loadBlueprints();
    console.log(`✓ Loaded ${blueprints.length} blueprints`);

    for (const bp of blueprints) {
      // Check for required fields
      if (!bp.description) {
        console.error(`  ✗ Blueprint ${bp.id}: missing description`);
        errors++;
      }
      if (bp.beats.length === 0) {
        console.error(`  ✗ Blueprint ${bp.id}: no beats defined`);
        errors++;
      }
      // Check beat numbering (should be 1, 2, 3, ... with no gaps)
      const beats = bp.beats.map(b => b.beat).sort((a, b) => a - b);
      for (let i = 0; i < beats.length; i++) {
        if (beats[i] !== i + 1) {
          console.error(`  ✗ Blueprint ${bp.id}: beat numbering gap at ${i + 1}`);
          errors++;
          break;
        }
      }
      // Check for duplicate exercises within a blueprint
      const bpExerciseSlugs = bp.beats.map(b => b.exercise);
      const uniqueSlugs = new Set(bpExerciseSlugs);
      if (uniqueSlugs.size !== bpExerciseSlugs.length) {
        const duplicates = bpExerciseSlugs.filter((slug, index) => bpExerciseSlugs.indexOf(slug) !== index);
        console.error(`  ✗ Blueprint ${bp.id}: duplicate exercises: ${[...new Set(duplicates)].join(', ')}`);
        errors++;
      }
      // Check that all exercises exist in exercise YAML files
      for (const beat of bp.beats) {
        if (!exerciseSlugs.has(beat.exercise)) {
          console.error(`  ✗ Blueprint ${bp.id}: exercise '${beat.exercise}' (beat ${beat.beat}) not found in exercises/`);
          errors++;
        }
        // Validate side-quest exercises exist
        if (beat.sideQuests) {
          for (const sideQuest of beat.sideQuests) {
            if (!exerciseSlugs.has(sideQuest)) {
              console.error(`  ✗ Blueprint ${bp.id} beat ${beat.beat}: side-quest exercise '${sideQuest}' not found in exercises/`);
              errors++;
            }
          }
        }
      }
    }

    // Load and validate skins
    const skins = await loadSkins();
    console.log(`✓ Loaded ${skins.length} skins`);

    for (const skin of skins) {
      // Check for required vars
      const requiredVars = ['list_name', 'item_singular', 'item_plural'];
      for (const v of requiredVars) {
        if (!skin.vars[v]) {
          console.error(`  ✗ Skin ${skin.id}: missing var ${v}`);
          errors++;
        }
      }
      // Check blueprint references (if skin is blueprint-restricted)
      if (skin.blueprints) {
        for (const bpId of skin.blueprints) {
          if (!blueprints.find(bp => bp.id === bpId)) {
            console.error(`  ✗ Skin ${skin.id}: references unknown blueprint ${bpId}`);
            errors++;
          }
        }
        // Check contexts reference valid exercises in blueprints (including side-quests)
        for (const exerciseSlug of Object.keys(skin.contexts)) {
          const isInBlueprint = skin.blueprints.some(bpId => {
            const bp = blueprints.find(b => b.id === bpId);
            return bp?.beats.some(beat =>
              beat.exercise === exerciseSlug ||
              beat.sideQuests?.includes(exerciseSlug)
            );
          });
          if (!isInBlueprint) {
            console.warn(`  ⚠ Skin ${skin.id}: context for '${exerciseSlug}' not in any linked blueprint`);
          }
        }
      }
    }

    // Summary
    console.log('\n---');
    if (errors === 0) {
      console.log('✓ All paths valid!');
      process.exit(0);
    } else {
      console.error(`✗ Found ${errors} error(s)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Validation failed:', err);
    process.exit(1);
  }
}

main();
