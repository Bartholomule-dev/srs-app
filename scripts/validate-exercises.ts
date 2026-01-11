// scripts/validate-exercises.ts
import Ajv from 'ajv';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';
import { parseArgs } from 'util';
import { validateYamlFile } from '../src/lib/exercise/yaml-validation';

const ajv = new Ajv({ allErrors: true });

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    language: { type: 'string', default: 'python' },
  },
});

const language = values.language ?? 'python';

function validateExercises() {
  const schemaPath = join(process.cwd(), 'exercises/schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  const exercisesDir = join(process.cwd(), 'exercises', language);

  // Check if exercises directory exists - gracefully handle missing directories
  if (!existsSync(exercisesDir)) {
    console.warn(`\n⚠️  No exercises directory found for language '${language}': ${exercisesDir}`);
    console.warn('   Skipping validation (directory does not exist yet).\n');
    process.exit(0);
  }

  const files = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));

  let hasErrors = false;
  const allSlugs = new Set<string>();

  for (const file of files) {
    const filePath = join(exercisesDir, file);
    const content = readFileSync(filePath, 'utf-8');

    // Handle YAML parse errors gracefully
    let data;
    try {
      data = parse(content);
    } catch (parseError) {
      console.error(`\n❌ ${file}: YAML parse error`);
      console.error(`  ${parseError instanceof Error ? parseError.message : parseError}`);
      hasErrors = true;
      continue;
    }

    const valid = validate(data);
    if (!valid) {
      console.error(`\n❌ ${file}:`);
      validate.errors?.forEach(err => {
        console.error(`  ${err.instancePath}: ${err.message}`);
      });
      hasErrors = true;
    } else {
      console.log(`✓ ${file}`);
    }

    const semanticResult = validateYamlFile(data, file);
    if (!semanticResult.valid) {
      console.error(`\n❌ ${file}: semantic validation`);
      semanticResult.errors.forEach(err => {
        const slugLabel = err.slug ? ` (${err.slug})` : '';
        console.error(`  ${err.field}${slugLabel}: ${err.message}`);
      });
      hasErrors = true;
    }

    // Check for duplicate slugs and type-specific fields
    for (const exercise of data.exercises || []) {
      if (allSlugs.has(exercise.slug)) {
        console.error(`\n❌ Duplicate slug: ${exercise.slug} in ${file}`);
        hasErrors = true;
      }
      allSlugs.add(exercise.slug);

      // Validate type-specific required fields
      if (exercise.type === 'predict' && !exercise.code) {
        console.error(`\n❌ ${exercise.slug}: predict type requires 'code' field`);
        hasErrors = true;
      }

      if (exercise.type === 'fill-in') {
        if (!exercise.template) {
          console.error(`\n❌ ${exercise.slug}: fill-in type requires 'template' field`);
          hasErrors = true;
        }
        if (exercise.blank_position === undefined) {
          console.error(`\n❌ ${exercise.slug}: fill-in type requires 'blank_position' field`);
          hasErrors = true;
        }
      }

      // Validate grading_strategy field
      const validStrategies = ['exact', 'token', 'ast', 'execution'];
      if (exercise.grading_strategy !== undefined && !validStrategies.includes(exercise.grading_strategy)) {
        console.error(`\n❌ ${exercise.slug}: grading_strategy must be one of: ${validStrategies.join(', ')}`);
        hasErrors = true;
      }

      // Validate verification_script requires execution strategy
      if (exercise.verification_script && exercise.grading_strategy && exercise.grading_strategy !== 'execution') {
        console.error(`\n❌ ${exercise.slug}: verification_script requires grading_strategy 'execution'`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    console.error(`\n❌ Validation failed for ${language} exercises`);
    process.exit(1);
  } else {
    console.log(`\n✓ All ${language} exercises valid`);
  }
}

validateExercises();
