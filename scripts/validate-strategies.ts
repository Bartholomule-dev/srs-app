// scripts/validate-strategies.ts
// CI validation for grading strategies

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

interface YamlExerciseFile {
  language: string;
  category: string;
  exercises: YamlExercise[];
}

interface YamlExercise {
  slug: string;
  type: string;
  grading_strategy?: string;
  verification_script?: string;
  verify_by_execution?: boolean;
  [key: string]: unknown;
}

const VALID_STRATEGIES = ['exact', 'token', 'ast', 'execution'];
const errors: string[] = [];
const warnings: string[] = [];

async function validateStrategies() {
  const exercisesDir = join(process.cwd(), 'exercises/python');

  // Check if exercises directory exists
  if (!existsSync(exercisesDir)) {
    console.error(`\nExercises directory not found: ${exercisesDir}`);
    process.exit(1);
  }

  const files = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const filePath = join(exercisesDir, file);
    const content = readFileSync(filePath, 'utf-8');

    let parsed: YamlExerciseFile;
    try {
      parsed = parse(content) as YamlExerciseFile;
    } catch (parseError) {
      errors.push(`${file}: YAML parse error - ${parseError instanceof Error ? parseError.message : parseError}`);
      continue;
    }

    for (const ex of parsed.exercises) {
      validateExercise(ex, file);
    }
  }

  // Report results
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.error('\nValidation errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('\nAll strategy validations passed!');
}

function validateExercise(ex: YamlExercise, file: string) {
  const prefix = `${file}:${ex.slug}`;

  // Rule 1: grading_strategy must be valid if present
  if (ex.grading_strategy && !VALID_STRATEGIES.includes(ex.grading_strategy)) {
    errors.push(`${prefix}: Invalid grading_strategy '${ex.grading_strategy}'. Valid: ${VALID_STRATEGIES.join(', ')}`);
  }

  // Rule 2: verification_script only with execution strategy
  if (ex.verification_script && ex.grading_strategy && ex.grading_strategy !== 'execution') {
    errors.push(`${prefix}: verification_script requires grading_strategy: execution`);
  }

  // Rule 3: Can't have both verify_by_execution and grading_strategy
  if (ex.verify_by_execution && ex.grading_strategy) {
    warnings.push(`${prefix}: Both verify_by_execution and grading_strategy set. Use grading_strategy only.`);
  }

  // Rule 4: Verification scripts should contain assertions
  if (ex.verification_script && !ex.verification_script.includes('assert')) {
    warnings.push(`${prefix}: verification_script should contain assertions`);
  }

  // Rule 5: Warn about predict exercises without explicit strategy
  // (They default to execution, but making it explicit is good)
  // Commented out for now to avoid too much noise
  // if (ex.type === 'predict' && !ex.grading_strategy) {
  //   warnings.push(`${prefix}: Predict exercise without explicit grading_strategy (defaults to execution)`);
  // }
}

validateStrategies().catch(console.error);
