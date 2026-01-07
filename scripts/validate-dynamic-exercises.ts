// scripts/validate-dynamic-exercises.ts
// Validates that all dynamic exercises render correctly

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { hasGenerator } from '../src/lib/generators';
import { renderExercise } from '../src/lib/generators/render';

interface YamlExercise {
  slug: string;
  prompt: string;
  expected_answer: string;
  accepted_solutions?: string[];
  generator?: string;
  code?: string;
  template?: string;
}

interface YamlFile {
  exercises: YamlExercise[];
}

async function validateDynamicExercises() {
  const exercisesDir = join(process.cwd(), 'exercises/python');

  // Check if exercises directory exists
  if (!existsSync(exercisesDir)) {
    console.error(`Exercises directory not found: ${exercisesDir}`);
    process.exit(1);
  }

  const files = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));
  let errors = 0;
  let dynamicCount = 0;

  console.log('Validating dynamic exercises...\n');

  for (const file of files) {
    const filePath = join(exercisesDir, file);
    const content = readFileSync(filePath, 'utf-8');

    let data: YamlFile;
    try {
      data = parse(content) as YamlFile;
    } catch (parseError) {
      console.error(`[${file}] YAML parse error: ${parseError}`);
      errors++;
      continue;
    }

    for (const exercise of data.exercises ?? []) {
      if (!exercise.generator) continue;

      dynamicCount++;

      // Check generator exists
      if (!hasGenerator(exercise.generator)) {
        console.error(`[${file}] ${exercise.slug}: Unknown generator '${exercise.generator}'`);
        errors++;
        continue;
      }

      // Try rendering with test seed
      try {
        const rendered = renderExercise(
          {
            slug: exercise.slug,
            prompt: exercise.prompt,
            expectedAnswer: exercise.expected_answer,
            acceptedSolutions: exercise.accepted_solutions ?? [],
            generator: exercise.generator,
            code: exercise.code,
            template: exercise.template,
          },
          'test-user',
          new Date()
        );

        // Verify no unrendered placeholders
        if (rendered.prompt.includes('{{')) {
          console.error(`[${file}] ${exercise.slug}: Unrendered placeholders in prompt`);
          errors++;
        }
        if (rendered.expectedAnswer.includes('{{')) {
          console.error(`[${file}] ${exercise.slug}: Unrendered placeholders in expected_answer`);
          errors++;
        }
        if (rendered.code && rendered.code.includes('{{')) {
          console.error(`[${file}] ${exercise.slug}: Unrendered placeholders in code`);
          errors++;
        }
        if (rendered.template && rendered.template.includes('{{')) {
          console.error(`[${file}] ${exercise.slug}: Unrendered placeholders in template`);
          errors++;
        }

        // Check accepted solutions for unrendered placeholders
        for (let i = 0; i < rendered.acceptedSolutions.length; i++) {
          if (rendered.acceptedSolutions[i].includes('{{')) {
            console.error(`[${file}] ${exercise.slug}: Unrendered placeholders in accepted_solutions[${i}]`);
            errors++;
          }
        }

        console.log(`  [${file}] ${exercise.slug}: OK (generator: ${exercise.generator})`);
      } catch (err) {
        console.error(`[${file}] ${exercise.slug}: Render error - ${err}`);
        errors++;
      }
    }
  }

  console.log(`\nValidated ${dynamicCount} dynamic exercises`);

  if (errors > 0) {
    console.error(`Found ${errors} errors`);
    process.exit(1);
  } else {
    console.log('All dynamic exercises valid!');
  }
}

validateDynamicExercises();
