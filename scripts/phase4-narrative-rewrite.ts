import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const EXERCISES_DIR = path.join(process.cwd(), 'exercises', 'python');
const CURRICULUM_PATH = path.join(process.cwd(), 'src', 'lib', 'curriculum', 'python.json');

const replacements: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bUsers\b/g, replacement: 'Customers' },
  { pattern: /\bUser\b/g, replacement: 'Customer' },
  { pattern: /\busers\b/g, replacement: 'customers' },
  { pattern: /\buser\b/g, replacement: 'customer' },
  { pattern: /\bItems\b/g, replacement: 'Products' },
  { pattern: /\bItem\b/g, replacement: 'Product' },
  { pattern: /\bitems\b/g, replacement: 'products' },
  { pattern: /\bitem\b/g, replacement: 'product' },
  { pattern: /\bTasks\b/g, replacement: 'Orders' },
  { pattern: /\bTask\b/g, replacement: 'Order' },
  { pattern: /\btasks\b/g, replacement: 'orders' },
  { pattern: /\btask\b/g, replacement: 'order' },
  { pattern: /\bStudents\b/g, replacement: 'Customers' },
  { pattern: /\bStudent\b/g, replacement: 'Customer' },
  { pattern: /\bstudents\b/g, replacement: 'customers' },
  { pattern: /\bstudent\b/g, replacement: 'customer' },
];

const tokenRegex = /(\{\{[^}]+\}\}|`[^`]*`)/g;

function rewriteText(text: string): string {
  const parts = text.split(tokenRegex);
  return parts
    .map((part) => {
      if (part.startsWith('{{') || part.startsWith('`')) {
        return part;
      }
      let updated = part;
      for (const { pattern, replacement } of replacements) {
        updated = updated.replace(pattern, replacement);
      }
      return updated;
    })
    .join('');
}

function rewriteExerciseFile(filePath: string): boolean {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(raw) as { exercises?: Array<Record<string, unknown>> };
  if (!data || !Array.isArray(data.exercises)) {
    return false;
  }

  let changed = false;

  for (const exercise of data.exercises) {
    for (const key of ['objective', 'title', 'prompt'] as const) {
      const value = exercise[key];
      if (typeof value === 'string') {
        const updated = rewriteText(value);
        if (updated !== value) {
          exercise[key] = updated;
          changed = true;
        }
      }
    }

    const hints = exercise.hints;
    if (Array.isArray(hints)) {
      const updatedHints = hints.map((hint) => (typeof hint === 'string' ? rewriteText(hint) : hint));
      if (JSON.stringify(updatedHints) !== JSON.stringify(hints)) {
        exercise.hints = updatedHints;
        changed = true;
      }
    }
  }

  if (changed) {
    const dumped = yaml.dump(data, { lineWidth: 120, noRefs: true });
    fs.writeFileSync(filePath, dumped);
  }

  return changed;
}

function rewriteCurriculum(): boolean {
  const raw = fs.readFileSync(CURRICULUM_PATH, 'utf8');
  const data = JSON.parse(raw) as {
    subconcepts?: Record<string, { teaching?: Record<string, unknown> }>;
  };

  if (!data.subconcepts) {
    return false;
  }

  let changed = false;

  for (const subconcept of Object.values(data.subconcepts)) {
    const teaching = subconcept.teaching;
    if (!teaching) continue;

    for (const key of ['explanation', 'exampleCode'] as const) {
      const value = teaching[key];
      if (typeof value === 'string') {
        const updated = rewriteText(value);
        if (updated !== value) {
          teaching[key] = updated;
          changed = true;
        }
      }
    }

    const pitfall = teaching.pitfall as Record<string, unknown> | undefined;
    if (pitfall) {
      for (const key of ['mistake', 'why', 'fix'] as const) {
        const value = pitfall[key];
        if (typeof value === 'string') {
          const updated = rewriteText(value);
          if (updated !== value) {
            pitfall[key] = updated;
            changed = true;
          }
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(CURRICULUM_PATH, JSON.stringify(data, null, 2) + '\n');
  }

  return changed;
}

function main() {
  const files = fs
    .readdirSync(EXERCISES_DIR)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
    .map((file) => path.join(EXERCISES_DIR, file));

  let updatedFiles = 0;
  for (const filePath of files) {
    if (rewriteExerciseFile(filePath)) {
      updatedFiles += 1;
    }
  }

  const curriculumUpdated = rewriteCurriculum();

  console.log(`Updated exercise files: ${updatedFiles}`);
  console.log(`Curriculum updated: ${curriculumUpdated ? 'yes' : 'no'}`);
}

main();
