// scripts/add-integrated-skin-contexts.ts
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

interface Exercise {
  slug: string;
  title: string;
  level?: string;
}

interface ExerciseFile {
  exercises?: Exercise[];
}

interface Skin {
  title: string;
  contexts?: Record<string, string>;
}

const exercisesDir = join(process.cwd(), 'exercises', 'python');
const skinsDir = join(process.cwd(), 'paths', 'python', 'skins');

const exerciseFiles = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));
const integratedTitles = new Map<string, string>();

for (const file of exerciseFiles) {
  const content = readFileSync(join(exercisesDir, file), 'utf-8');
  const data = parse(content) as ExerciseFile;
  for (const ex of data.exercises ?? []) {
    if (ex.level === 'integrated') {
      integratedTitles.set(ex.slug, ex.title);
    }
  }
}

const integratedSlugs = [...integratedTitles.keys()].sort();

const skinFiles = readdirSync(skinsDir).filter(f => f.endsWith('.yaml')).sort();
let updatedSkins = 0;

for (const file of skinFiles) {
  const filePath = join(skinsDir, file);
  const content = readFileSync(filePath, 'utf-8');
  const data = parse(content) as Skin;
  const contexts = data.contexts ?? {};
  const missing = integratedSlugs.filter(slug => !(slug in contexts));

  if (missing.length === 0) {
    continue;
  }

  const title = data.title ?? 'project';
  const lines = missing.map((slug) => {
    const exerciseTitle = integratedTitles.get(slug) ?? slug;
    return `  ${slug}: "Use this step in the ${title} workflow: ${exerciseTitle}."`;
  });

  const trimmed = content.endsWith('\n') ? content : `${content}\n`;
  const updated = `${trimmed}${lines.join('\n')}\n`;
  writeFileSync(filePath, updated, 'utf-8');
  updatedSkins += 1;
}

console.log(`Updated ${updatedSkins} skin files.`);
