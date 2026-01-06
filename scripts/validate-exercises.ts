// scripts/validate-exercises.ts
import Ajv from 'ajv';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

const ajv = new Ajv({ allErrors: true });

function validateExercises() {
  const schemaPath = join(process.cwd(), 'exercises/schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  const exercisesDir = join(process.cwd(), 'exercises/python');

  // Check if exercises directory exists
  if (!existsSync(exercisesDir)) {
    console.error(`\n❌ Exercises directory not found: ${exercisesDir}`);
    process.exit(1);
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
    }
  }

  if (hasErrors) {
    console.error('\n❌ Validation failed');
    process.exit(1);
  } else {
    console.log('\n✓ All exercises valid');
  }
}

validateExercises();
