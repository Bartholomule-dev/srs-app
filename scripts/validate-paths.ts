// scripts/validate-paths.ts
// Validates blueprint and skin YAML files for the path system
import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';
import { parseArgs } from 'util';
import yaml from 'js-yaml';
import { loadBlueprints, loadSkins } from '../src/lib/paths/loader';

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    language: { type: 'string', default: 'python' },
  },
});

const language = values.language ?? 'python';
const pathsDir = join(process.cwd(), 'paths', language);
const exercisesDir = join(process.cwd(), 'exercises', language);

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
    await access(exercisesDir);
    const files = await readdir(exercisesDir);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of yamlFiles) {
      const content = await readFile(join(exercisesDir, file), 'utf-8');
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
    console.warn(`  Warning: Could not load exercises for ${language}:`, (err as Error).message);
  }

  return slugs;
}

async function main() {
  console.log(`Validating paths for language: ${language}\n`);

  // Check if paths directory exists for this language
  try {
    await access(pathsDir);
  } catch {
    console.log(`Note: No paths directory found for '${language}' at ${pathsDir}`);
    console.log('This is expected for languages without blueprints/skins yet.');
    console.log('\n---');
    console.log('Validation skipped (no paths to validate)');
    process.exit(0);
  }

  let errors = 0;

  try {
    // Load exercise slugs for validation
    const exerciseSlugs = await loadExerciseSlugs();
    console.log(`Loaded ${exerciseSlugs.size} exercise slugs for validation`);

    // Load and validate blueprints
    const blueprints = await loadBlueprints(language);
    console.log(`Loaded ${blueprints.length} blueprints`);

    for (const bp of blueprints) {
      // Check for required fields
      if (!bp.description) {
        console.error(`  Error: Blueprint ${bp.id}: missing description`);
        errors++;
      }
      if (bp.beats.length === 0) {
        console.error(`  Error: Blueprint ${bp.id}: no beats defined`);
        errors++;
      }
      // Check beat numbering (should be 1, 2, 3, ... with no gaps)
      const beats = bp.beats.map(b => b.beat).sort((a, b) => a - b);
      for (let i = 0; i < beats.length; i++) {
        if (beats[i] !== i + 1) {
          console.error(`  Error: Blueprint ${bp.id}: beat numbering gap at ${i + 1}`);
          errors++;
          break;
        }
      }
      // Check for duplicate exercises within a blueprint
      const bpExerciseSlugs = bp.beats.map(b => b.exercise);
      const uniqueSlugs = new Set(bpExerciseSlugs);
      if (uniqueSlugs.size !== bpExerciseSlugs.length) {
        const duplicates = bpExerciseSlugs.filter((slug, index) => bpExerciseSlugs.indexOf(slug) !== index);
        console.error(`  Error: Blueprint ${bp.id}: duplicate exercises: ${[...new Set(duplicates)].join(', ')}`);
        errors++;
      }
      // Check that all exercises exist in exercise YAML files
      for (const beat of bp.beats) {
        if (!exerciseSlugs.has(beat.exercise)) {
          console.error(`  Error: Blueprint ${bp.id}: exercise '${beat.exercise}' (beat ${beat.beat}) not found in exercises/`);
          errors++;
        }
        // Validate side-quest exercises exist
        if (beat.sideQuests) {
          for (const sideQuest of beat.sideQuests) {
            if (!exerciseSlugs.has(sideQuest)) {
              console.error(`  Error: Blueprint ${bp.id} beat ${beat.beat}: side-quest exercise '${sideQuest}' not found in exercises/`);
              errors++;
            }
          }
        }
      }
    }

    // Load and validate skins
    const skins = await loadSkins(language);
    console.log(`Loaded ${skins.length} skins`);

    // Extended structural variable validation
    const REQUIRED_STRUCTURAL_VARS = [
      'list_name',
      'item_singular',
      'item_plural',
      'item_examples',
      'record_keys',
      'attr_key_1',
      'attr_key_2',
      'id_var',
    ];

    for (const skin of skins) {
      // Check for required structural vars
      for (const v of REQUIRED_STRUCTURAL_VARS) {
        const value = skin.vars[v];
        if (value === undefined || value === null || value === '') {
          console.error(`  Error: Skin ${skin.id}: missing structural var ${v}`);
          errors++;
        }
      }

      // Check array lengths
      if (!Array.isArray(skin.vars.item_examples) || skin.vars.item_examples.length < 3) {
        console.error(`  Error: Skin ${skin.id}: item_examples needs 3+ values`);
        errors++;
      }
      if (!Array.isArray(skin.vars.record_keys) || skin.vars.record_keys.length < 2) {
        console.error(`  Error: Skin ${skin.id}: record_keys needs 2+ values`);
        errors++;
      }
      // Check blueprint references (if skin is blueprint-restricted)
      if (skin.blueprints) {
        for (const bpId of skin.blueprints) {
          if (!blueprints.find(bp => bp.id === bpId)) {
            console.error(`  Error: Skin ${skin.id}: references unknown blueprint ${bpId}`);
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
            console.warn(`  Warning: Skin ${skin.id}: context for '${exerciseSlug}' not in any linked blueprint`);
          }
        }
      }
    }

    // Placeholder context detection
    const PLACEHOLDER_PATTERNS = [
      /Use this step in the .* workflow/i,
      /\[TODO\]/i,
      /PLACEHOLDER/i,
    ];

    let placeholderCount = 0;
    for (const skin of skins) {
      for (const [exercise, context] of Object.entries(skin.contexts)) {
        for (const pattern of PLACEHOLDER_PATTERNS) {
          if (pattern.test(context)) {
            placeholderCount++;
            // Only warn, don't error - we'll fix these incrementally
            if (placeholderCount <= 10) {
              console.warn(`  Warning: Skin ${skin.id}: placeholder context for '${exercise}'`);
            }
            break;
          }
        }
      }
    }
    if (placeholderCount > 10) {
      console.warn(`  Warning: ... and ${placeholderCount - 10} more placeholder contexts`);
    }
    if (placeholderCount > 0) {
      console.warn(`  Warning: Total: ${placeholderCount} placeholder contexts need real text`);
    }

    // Summary
    console.log('\n---');
    if (errors === 0) {
      console.log('All paths valid!');
      process.exit(0);
    } else {
      console.error(`Found ${errors} error(s)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Validation failed:', err);
    process.exit(1);
  }
}

main();
