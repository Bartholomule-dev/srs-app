// scripts/generate-exercise-list.ts
// AUTO-GENERATES Exercise documentation from YAML source of truth
// Creates: Exercises/index.md (compact) + Exercises/<concept>.md (detailed)
// Usage: npx tsx scripts/generate-exercise-list.ts --obsidian /path/to/vault

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

interface Exercise {
  slug: string;
  title: string;
  prompt: string;
  expected_answer: string;
  type: 'write' | 'fill-in' | 'predict';
  level: 'intro' | 'practice' | 'edge';
  concept: string;
  subconcept: string;
  generator?: string;
  code?: string;
}

interface YamlFile {
  language: string;
  category: string;
  exercises: Exercise[];
}

interface Beat {
  beat: number;
  exercise: string;
  title: string;
  sideQuests?: string[];
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  concepts: string[];
  beats: Beat[];
}

interface Skin {
  id: string;
  title: string;
  icon: string;
  blueprints: string[];
  vars: Record<string, unknown>;
  contexts: Record<string, string>;
}

interface PathData {
  blueprints: Blueprint[];
  skins: Skin[];
  exerciseToBlueprints: Map<string, { blueprintId: string; beat: number; beatTitle: string }[]>;
}

interface Stats {
  total: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  byConcept: Record<string, number>;
  bySubconcept: Record<string, Record<string, Exercise[]>>;
  dynamic: number;
  duplicates: string[];
}

const TYPE_ABBREV: Record<string, string> = {
  write: 'W',
  'fill-in': 'F',
  predict: 'P',
};

const LEVEL_ABBREV: Record<string, string> = {
  intro: 'I',
  practice: 'P',
  edge: 'E',
};

/**
 * Generate a short abbreviation from a blueprint ID.
 * e.g., "collection-cli-app" -> "CCA", "data-processor" -> "DP"
 */
function blueprintAbbrev(id: string): string {
  return id.split('-').map(w => w[0]?.toUpperCase() || '').join('');
}

function parseAllYaml(): { exercises: Exercise[]; stats: Stats } {
  const exercisesDir = join(process.cwd(), 'exercises/python');
  const files = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));

  const allExercises: Exercise[] = [];
  const slugSet = new Set<string>();
  const duplicates: string[] = [];

  for (const file of files) {
    const filePath = join(exercisesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const data = parse(content) as YamlFile;

    for (const exercise of data.exercises) {
      if (slugSet.has(exercise.slug)) {
        duplicates.push(exercise.slug);
      }
      slugSet.add(exercise.slug);
      allExercises.push(exercise);
    }
  }

  // Compute stats
  const stats: Stats = {
    total: allExercises.length,
    byType: {},
    byLevel: {},
    byConcept: {},
    bySubconcept: {},
    dynamic: 0,
    duplicates,
  };

  for (const ex of allExercises) {
    stats.byType[ex.type] = (stats.byType[ex.type] || 0) + 1;
    stats.byLevel[ex.level] = (stats.byLevel[ex.level] || 0) + 1;
    stats.byConcept[ex.concept] = (stats.byConcept[ex.concept] || 0) + 1;

    if (!stats.bySubconcept[ex.concept]) {
      stats.bySubconcept[ex.concept] = {};
    }
    if (!stats.bySubconcept[ex.concept][ex.subconcept]) {
      stats.bySubconcept[ex.concept][ex.subconcept] = [];
    }
    stats.bySubconcept[ex.concept][ex.subconcept].push(ex);

    if (ex.generator) {
      stats.dynamic++;
    }
  }

  return { exercises: allExercises, stats };
}

function parsePathData(): PathData {
  const pathsDir = join(process.cwd(), 'paths/python');
  const blueprintsDir = join(pathsDir, 'blueprints');
  const skinsDir = join(pathsDir, 'skins');

  const blueprints: Blueprint[] = [];
  const skins: Skin[] = [];
  const exerciseToBlueprints = new Map<string, { blueprintId: string; beat: number; beatTitle: string }[]>();

  if (existsSync(blueprintsDir)) {
    const blueprintFiles = readdirSync(blueprintsDir).filter(f => f.endsWith('.yaml'));
    for (const file of blueprintFiles) {
      const filePath = join(blueprintsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const bp = parse(content) as Blueprint;
      blueprints.push(bp);

      for (const beat of bp.beats) {
        const existing = exerciseToBlueprints.get(beat.exercise) || [];
        existing.push({ blueprintId: bp.id, beat: beat.beat, beatTitle: beat.title });
        exerciseToBlueprints.set(beat.exercise, existing);

        if (beat.sideQuests) {
          for (const sqSlug of beat.sideQuests) {
            const sqExisting = exerciseToBlueprints.get(sqSlug) || [];
            sqExisting.push({ blueprintId: bp.id, beat: beat.beat, beatTitle: `${beat.title} (side-quest)` });
            exerciseToBlueprints.set(sqSlug, sqExisting);
          }
        }
      }
    }
  }

  if (existsSync(skinsDir)) {
    const skinFiles = readdirSync(skinsDir).filter(f => f.endsWith('.yaml'));
    for (const file of skinFiles) {
      const filePath = join(skinsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const skin = parse(content) as Skin;
      skins.push(skin);
    }
  }

  return { blueprints, skins, exerciseToBlueprints };
}

/**
 * Escape markdown special characters and normalize whitespace.
 * No truncation - full content is needed for AI parsing.
 */
function normalizeText(text: string): string {
  return text.trim();
}

function escapeMarkdown(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function capitalize(s: string): string {
  return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Generate compact index file with summary and links to concept files
 */
function generateIndexMarkdown(stats: Stats, pathData: PathData): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split('T')[0];

  lines.push('<!-- AUTO-GENERATED - DO NOT EDIT -->');
  lines.push('');
  lines.push('# Python Exercises');
  lines.push('');
  lines.push(`**${stats.total}** exercises | **${stats.dynamic}** dynamic | **${Object.keys(stats.byConcept).length}** concepts | **${Object.keys(stats.bySubconcept).reduce((acc, c) => acc + Object.keys(stats.bySubconcept[c]).length, 0)}** subconcepts`);
  lines.push('');

  // Compact type/level stats on one line
  lines.push(`Types: W=${stats.byType.write || 0} F=${stats.byType['fill-in'] || 0} P=${stats.byType.predict || 0} | Levels: I=${stats.byLevel.intro || 0} P=${stats.byLevel.practice || 0} E=${stats.byLevel.edge || 0}`);
  lines.push('');

  if (stats.duplicates.length > 0) {
    lines.push(`> ⚠️ Duplicates: ${stats.duplicates.join(', ')}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Concept table with links
  lines.push('## By Concept');
  lines.push('');
  lines.push('| Concept | Exercises | Subconcepts | W | F | P | Dyn |');
  lines.push('|---------|-----------|-------------|---|---|---|-----|');

  const sortedConcepts = Object.keys(stats.byConcept).sort();
  for (const concept of sortedConcepts) {
    const subconcepts = stats.bySubconcept[concept];
    const subconceptCount = Object.keys(subconcepts).length;
    const exercises = Object.values(subconcepts).flat();

    const w = exercises.filter(e => e.type === 'write').length;
    const f = exercises.filter(e => e.type === 'fill-in').length;
    const p = exercises.filter(e => e.type === 'predict').length;
    const dyn = exercises.filter(e => e.generator).length;

    lines.push(`| [[${concept}\\|${capitalize(concept)}]] | ${stats.byConcept[concept]} | ${subconceptCount} | ${w} | ${f} | ${p} | ${dyn || '-'} |`);
  }
  lines.push('');

  // Blueprint summary (very compact)
  if (pathData.blueprints.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Blueprints & Skins');
    lines.push('');
    lines.push(`**${pathData.blueprints.length}** blueprints (${pathData.blueprints.reduce((a, b) => a + b.beats.length, 0)} beats) | **${pathData.skins.length}** skins | **${pathData.exerciseToBlueprints.size}** exercises in paths`);
    lines.push('');
    lines.push('See [[Blueprints]] for details.');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Legend');
  lines.push('');
  lines.push('W=Write, F=Fill-in, P=Predict | I=Intro, P=Practice, E=Edge | Dyn=Dynamic');
  lines.push('');
  lines.push(`*Generated: ${now}*`);

  return lines.join('\n');
}

/**
 * Generate detailed concept file with all exercises for that concept
 */
function generateConceptMarkdown(concept: string, stats: Stats, pathData: PathData): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split('T')[0];
  const subconcepts = stats.bySubconcept[concept];
  const totalExercises = stats.byConcept[concept];

  lines.push('<!-- AUTO-GENERATED - DO NOT EDIT -->');
  lines.push('');
  lines.push(`# ${capitalize(concept)}`);
  lines.push('');
  lines.push(`**${totalExercises}** exercises across **${Object.keys(subconcepts).length}** subconcepts`);
  lines.push('');
  lines.push('[[index|← Back to Index]]');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Subconcept summary
  lines.push('## Subconcepts');
  lines.push('');
  const sortedSubconcepts = Object.keys(subconcepts).sort();
  for (const sub of sortedSubconcepts) {
    const exercises = subconcepts[sub];
    const types = exercises.map(e => TYPE_ABBREV[e.type]).join('');
    const dynCount = exercises.filter(e => e.generator).length;
    const dynNote = dynCount > 0 ? ` (${dynCount} dyn)` : '';
    lines.push(`- [[#${sub}|${sub}]] (${exercises.length})${dynNote}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Exercise tables by subconcept
  for (const subconcept of sortedSubconcepts) {
    const exercises = subconcepts[subconcept];
    lines.push(`## ${subconcept}`);
    lines.push('');
    lines.push('| Type | Lvl | Prompt | Code | Answer | Dyn | BP |');
    lines.push('|------|-----|--------|------|--------|-----|----| ');

    // Sort by level, then slug
    const levelOrder = ['intro', 'practice', 'edge'];
    const sorted = [...exercises].sort((a, b) => {
      const levelDiff = levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
      if (levelDiff !== 0) return levelDiff;
      return a.slug.localeCompare(b.slug);
    });

    for (const ex of sorted) {
      const typeAbbrev = TYPE_ABBREV[ex.type] || ex.type;
      const levelAbbrev = LEVEL_ABBREV[ex.level] || ex.level;
      const prompt = escapeMarkdown(ex.prompt);
      const code = ex.code ? '`' + escapeMarkdown(ex.code) + '`' : '';
      const answer = '`' + escapeMarkdown(ex.expected_answer) + '`';
      const dynamic = ex.generator ? '✓' : '';
      const bpRefs = pathData.exerciseToBlueprints.get(ex.slug);
      const bpCol = bpRefs ? bpRefs.map(r => `${blueprintAbbrev(r.blueprintId)}:${r.beat}`).join(',') : '';
      lines.push(`| ${typeAbbrev} | ${levelAbbrev} | ${prompt} | ${code} | ${answer} | ${dynamic} | ${bpCol} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`*Generated: ${now}*`);

  return lines.join('\n');
}

/**
 * Generate BLUEPRINTS.md - Blueprint and Skin documentation
 */
function generateBlueprintsMarkdown(pathData: PathData): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split('T')[0];

  lines.push('<!-- AUTO-GENERATED - DO NOT EDIT -->');
  lines.push('');
  lines.push('# Blueprints & Skins');
  lines.push('');
  lines.push(`**${pathData.blueprints.length}** blueprints (${pathData.blueprints.reduce((a, b) => a + b.beats.length, 0)} beats) | **${pathData.skins.length}** skins`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Blueprint summary table
  lines.push('## Blueprints');
  lines.push('');
  lines.push('| Blueprint | Beats | Difficulty | Concepts |');
  lines.push('|-----------|-------|------------|----------|');
  for (const bp of pathData.blueprints) {
    lines.push(`| [[#${bp.id}\\|${bp.title}]] | ${bp.beats.length} | ${bp.difficulty} | ${bp.concepts.join(', ')} |`);
  }
  lines.push('');

  // Skins summary
  lines.push('## Skins');
  lines.push('');
  lines.push('| Skin | Icon | Blueprints |');
  lines.push('|------|------|------------|');
  for (const skin of pathData.skins) {
    const bpList = skin.blueprints?.join(', ') || '(global)';
    lines.push(`| ${skin.title} | ${skin.icon} | ${bpList} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Blueprint details
  for (const bp of pathData.blueprints) {
    lines.push(`## ${bp.title}`);
    lines.push(`^${bp.id}`);
    lines.push('');
    lines.push(`> ${bp.description}`);
    lines.push('');
    lines.push(`**${bp.difficulty}** | ${bp.concepts.join(', ')}`);
    lines.push('');

    const bpSkins = pathData.skins.filter(s => s.blueprints?.includes(bp.id));
    if (bpSkins.length > 0) {
      lines.push('Skins: ' + bpSkins.map(s => `${s.icon} ${s.title}`).join(' | '));
      lines.push('');
    }

    // Compact beat list
    lines.push('| Beat | Exercise | Title |');
    lines.push('|------|----------|-------|');
    for (const beat of bp.beats) {
      const sq = beat.sideQuests?.length ? ` (+${beat.sideQuests.length})` : '';
      lines.push(`| ${beat.beat} | \`${beat.exercise}\` | ${beat.title}${sq} |`);
    }
    lines.push('');
  }

  // Abbreviation legend
  lines.push('---');
  lines.push('');
  lines.push('## Abbreviations');
  lines.push('');
  for (const bp of pathData.blueprints) {
    lines.push(`**${blueprintAbbrev(bp.id)}** = ${bp.id}`);
  }
  lines.push('');
  lines.push(`*Generated: ${now}*`);

  return lines.join('\n');
}

/**
 * Generate GRADING-RUBRIC.md - Exercise quality rubric (unchanged, static content)
 */
function generateRubricMarkdown(): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split('T')[0];

  lines.push('<!-- AUTO-GENERATED - DO NOT EDIT -->');
  lines.push('');
  lines.push('# Exercise Grading Rubric');
  lines.push('');
  lines.push('8 dimensions (1-5 scale) + Code Correctness Gate. Max 40 points.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Gate: Code Correctness');
  lines.push('');
  lines.push('Verify expected_answer solves the prompt correctly before scoring.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Dimensions');
  lines.push('');
  lines.push('| Dim | Name | 5 (Best) | 1 (Worst) |');
  lines.push('|-----|------|----------|-----------|');
  lines.push('| Tr | Transfer Value | Core daily skill | Platform-specific |');
  lines.push('| Cg | Cognitive Match | Perfect for level | Grossly misplaced |');
  lines.push('| Dd | Decision Depth | Multiple approaches | Pure token recall |');
  lines.push('| Nv | Narrative Versatility | Universal + uses skin vars | Artificial |');
  lines.push('| Ad | Answer Determinism | Single canonical form | Highly subjective |');
  lines.push('| Cc | Coverage Completeness | All alternatives covered | High false-negative |');
  lines.push('| Id | Idiom Quality | Pythonic best practice | Teaches anti-pattern |');
  lines.push('| Pc | Prompt Clarity | Crystal clear spec | Confusing/misleading |');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Thresholds');
  lines.push('');
  lines.push('- **35-40**: Excellent');
  lines.push('- **28-34**: Good');
  lines.push('- **20-27**: Acceptable');
  lines.push('- **<20**: Needs rework');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Target Dd by Level');
  lines.push('');
  lines.push('| Level | Target Dd |');
  lines.push('|-------|-----------|');
  lines.push('| Intro | 1-2 |');
  lines.push('| Practice | 3-4 |');
  lines.push('| Edge | 4-5 |');
  lines.push('');
  lines.push(`*Generated: ${now}*`);

  return lines.join('\n');
}

function main() {
  console.log('📋 Parsing YAML files...');
  const { stats } = parseAllYaml();

  console.log('📦 Parsing blueprints & skins...');
  const pathData = parsePathData();

  console.log(`\n📊 Statistics:`);
  console.log(`   Total exercises: ${stats.total}`);
  console.log(`   Dynamic: ${stats.dynamic}`);
  console.log(`   Concepts: ${Object.keys(stats.byConcept).length}`);
  console.log(`   Blueprints: ${pathData.blueprints.length}`);
  console.log(`   Skins: ${pathData.skins.length}`);

  if (stats.duplicates.length > 0) {
    console.log(`\n⚠️  Duplicates: ${stats.duplicates.join(', ')}`);
  }

  // Require --obsidian flag
  const obsidianIndex = process.argv.indexOf('--obsidian');
  if (obsidianIndex === -1 || !process.argv[obsidianIndex + 1]) {
    console.error('❌ Error: --obsidian <vault-path> required');
    console.error('   Usage: npx tsx scripts/generate-exercise-list.ts --obsidian "/path/to/vault"');
    process.exit(1);
  }

  const srsAppDir = join(process.argv[obsidianIndex + 1], 'SRS-app');
  const exercisesDir = join(srsAppDir, 'Exercises');

  // Ensure directories exist
  if (!existsSync(srsAppDir)) {
    mkdirSync(srsAppDir, { recursive: true });
  }

  // Clean and recreate Exercises folder
  if (existsSync(exercisesDir)) {
    rmSync(exercisesDir, { recursive: true });
  }
  mkdirSync(exercisesDir, { recursive: true });

  console.log('\n📝 Generating files...');

  // Generate index
  const indexMd = generateIndexMarkdown(stats, pathData);
  writeFileSync(join(exercisesDir, 'index.md'), indexMd);
  console.log(`   ✓ Exercises/index.md`);

  // Generate per-concept files
  const sortedConcepts = Object.keys(stats.byConcept).sort();
  for (const concept of sortedConcepts) {
    const conceptMd = generateConceptMarkdown(concept, stats, pathData);
    writeFileSync(join(exercisesDir, `${concept}.md`), conceptMd);
    console.log(`   ✓ Exercises/${concept}.md`);
  }

  // Generate blueprints
  const blueprintsMd = generateBlueprintsMarkdown(pathData);
  writeFileSync(join(srsAppDir, 'Blueprints.md'), blueprintsMd);
  console.log(`   ✓ Blueprints.md`);

  // Generate rubric
  const rubricMd = generateRubricMarkdown();
  writeFileSync(join(srsAppDir, 'Grading-Rubric.md'), rubricMd);
  console.log(`   ✓ Grading-Rubric.md`);

  // Remove old Exercise-List.md if it exists
  const oldFile = join(srsAppDir, 'Exercise-List.md');
  if (existsSync(oldFile)) {
    rmSync(oldFile);
    console.log(`   ✓ Removed old Exercise-List.md`);
  }

  console.log('\n✅ Done!');
  console.log(`   Generated ${sortedConcepts.length + 3} files in ${srsAppDir}`);

  return stats;
}

// Export for validation
export { parseAllYaml };
export type { Stats };

main();
