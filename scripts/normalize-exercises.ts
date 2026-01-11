// scripts/normalize-exercises.ts
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse, stringify } from 'yaml';

interface Exercise {
  type?: string;
  expected_answer?: string;
  accepted_solutions?: string[];
  grading_strategy?: string;
}

interface YamlFile {
  exercises?: Exercise[];
}

const exercisesDir = join(process.cwd(), 'exercises', 'python');
const files = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml')).sort();

let updatedFiles = 0;
let updatedExercises = 0;

for (const file of files) {
  const filePath = join(exercisesDir, file);
  const content = readFileSync(filePath, 'utf-8');
  const data = parse(content) as YamlFile;
  let changed = false;

  for (const exercise of data.exercises ?? []) {
    if (exercise.type === 'write') {
      if (!Array.isArray(exercise.accepted_solutions) || exercise.accepted_solutions.length === 0) {
        const expected = typeof exercise.expected_answer === 'string'
          ? exercise.expected_answer
          : '';
        exercise.accepted_solutions = [expected];
        changed = true;
        updatedExercises += 1;
      }
    }

    if (exercise.type === 'predict') {
      if (!exercise.grading_strategy) {
        exercise.grading_strategy = 'exact';
        changed = true;
        updatedExercises += 1;
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, stringify(data), 'utf-8');
    updatedFiles += 1;
  }
}

console.log(`Updated ${updatedExercises} exercises across ${updatedFiles} files.`);
