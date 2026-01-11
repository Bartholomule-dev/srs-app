// scripts/trim-integrated-skin-contexts.ts
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

interface Blueprint {
  id: string;
  beats?: Array<{ exercise?: string; sideQuests?: string[] }>;
}

interface Skin {
  id: string;
  title: string;
  blueprints?: string[];
}

const exercisesDir = join(process.cwd(), 'exercises', 'python');
const skinsDir = join(process.cwd(), 'paths', 'python', 'skins');
const blueprintsDir = join(process.cwd(), 'paths', 'python', 'blueprints');

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

const blueprintFiles = readdirSync(blueprintsDir).filter(f => f.endsWith('.yaml'));
const blueprintExercises = new Map<string, Set<string>>();

for (const file of blueprintFiles) {
  const content = readFileSync(join(blueprintsDir, file), 'utf-8');
  const data = parse(content) as Blueprint;
  const set = new Set<string>();
  for (const beat of data.beats ?? []) {
    if (beat.exercise) set.add(beat.exercise);
    for (const sideQuest of beat.sideQuests ?? []) {
      set.add(sideQuest);
    }
  }
  blueprintExercises.set(data.id, set);
}

const skinFiles = readdirSync(skinsDir).filter(f => f.endsWith('.yaml')).sort();
let updatedSkins = 0;

for (const file of skinFiles) {
  const filePath = join(skinsDir, file);
  const content = readFileSync(filePath, 'utf-8');
  const data = parse(content) as Skin;
  const linkedBlueprints = data.blueprints ?? [];

  let allowed = new Set(integratedSlugs);
  if (linkedBlueprints.length > 0) {
    allowed = new Set<string>();
    for (const blueprintId of linkedBlueprints) {
      const exercises = blueprintExercises.get(blueprintId);
      if (!exercises) continue;
      for (const slug of exercises) {
        if (integratedTitles.has(slug)) {
          allowed.add(slug);
        }
      }
    }
  }

  const lines = content.split('\n');
  const contextLine = /^\s{2}([a-z0-9-]+): \"Use this step in the .* workflow: .*\.\"$/;
  const filtered = lines.filter((line) => {
    const match = line.match(contextLine);
    if (!match) return true;
    const slug = match[1];
    if (!integratedTitles.has(slug)) return true;
    return allowed.has(slug);
  });

  const existing = new Set<string>();
  for (const line of filtered) {
    const match = line.match(/^\s{2}([a-z0-9-]+):/);
    if (match) {
      existing.add(match[1]);
    }
  }

  const missing = integratedSlugs.filter(slug => allowed.has(slug) && !existing.has(slug));
  if (missing.length === 0 && filtered.length === lines.length) {
    continue;
  }

  const title = data.title ?? 'project';
  const additions = missing.map((slug) => {
    const exerciseTitle = integratedTitles.get(slug) ?? slug;
    return `  ${slug}: \"Use this step in the ${title} workflow: ${exerciseTitle}.\"`;
  });

  let updated = filtered.join('\n');
  if (!updated.endsWith('\n')) {
    updated += '\n';
  }
  if (additions.length > 0) {
    updated += `${additions.join('\n')}\n`;
  }

  writeFileSync(filePath, updated, 'utf-8');
  updatedSkins += 1;
}

console.log(`Updated ${updatedSkins} skin files.`);
